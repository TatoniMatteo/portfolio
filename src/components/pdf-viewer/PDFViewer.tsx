import {usePDFFullscreen} from './usePDFFullscreen';
import type {KeyboardEvent} from 'react';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faChevronLeft, faChevronRight, faDownload, faMinus, faPlus,
    faExpand, faCompress, faUpRightFromSquare, faFilePdf, faArrowsLeftRight,
} from '@fortawesome/free-solid-svg-icons';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

type Fit = 'width' | 'page';
interface PDFViewerProps {src: string; downloadName?: string; documentLanguage: string}
const clampZoom = (zoom: number) => Math.min(3, Math.max(0.5, Math.round(zoom * 10) / 10));

const PDFViewer = ({src, downloadName, documentLanguage}: PDFViewerProps) => {
    const {t} = useTranslation();
    const rootRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    const [document, setDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
    const [page, setPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [fit, setFit] = useState<Fit>('width');
    const [error, setError] = useState(false);
    const {fullscreen, toggleFullscreen} = usePDFFullscreen(rootRef);
    const [rendered, setRendered] = useState({page: 0, zoom: 0, fit: 'width' as Fit});
    const busy = !error && (!document || rendered.page !== page || rendered.zoom !== zoom || rendered.fit !== fit);

    useEffect(() => {
        let disposed = false;
        const task = pdfjs.getDocument({url: src});
        void task.promise.then((pdf) => {
            if (!disposed) setDocument(pdf);
        }).catch(() => {
            if (!disposed) setError(true);
        });
        return () => { disposed = true; void task.destroy().catch(() => undefined); };
    }, [src]);

    useEffect(() => {
        if (!document) return () => undefined;
        const viewportElement = viewportRef.current;
        const stage = stageRef.current;
        const paper = paperRef.current;
        if (!viewportElement || !stage || !paper) return () => undefined;
        let disposed = false;
        let generation = 0;
        let task: pdfjs.RenderTask | undefined;
        let textLayer: pdfjs.TextLayer | undefined;
        let resizeTimer: number | undefined;

        const render = async () => {
            const current = ++generation;
            task?.cancel();
            textLayer?.cancel();
            try {
                const pdfPage = await document.getPage(page);
                if (disposed || current !== generation) return;
                const natural = pdfPage.getViewport({scale: 1});
                const padding = getComputedStyle(stage);
                const horizontal = parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight);
                const vertical = parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom);
                const widthFit = Math.max(1, viewportElement.clientWidth - horizontal) / natural.width;
                const pageFit = Math.min(widthFit, Math.max(1, viewportElement.clientHeight - vertical) / natural.height);
                const viewport = pdfPage.getViewport({scale: (fit === 'width' ? widthFit : pageFit) * zoom});
                // Render offscreen, then commit the complete frame. Bound memory
                // on high-DPI screens while retaining a sharp zoomed document.
                const density = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 3,
                    Math.sqrt(12_000_000 / (viewport.width * viewport.height)));
                const canvas = window.document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width * density);
                canvas.height = Math.ceil(viewport.height * density);
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;
                canvas.setAttribute('aria-hidden', 'true');
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Canvas context unavailable');
                task = pdfPage.render({
                    canvas, canvasContext: context, viewport,
                    transform: [density, 0, 0, density, 0, 0], background: '#ffffff',
                });
                await task.promise;
                if (disposed || current !== generation) return;
                const text = window.document.createElement('div');
                text.className = 'pdf-text-layer';
                text.style.setProperty('--total-scale-factor', String(viewport.scale));
                const content = await pdfPage.getTextContent();
                if (disposed || current !== generation) return;
                textLayer = new pdfjs.TextLayer({textContentSource: content, container: text, viewport});
                await textLayer.render();
                if (disposed || current !== generation) return;
                const previousWidth = paper.clientWidth;
                const previousHeight = paper.clientHeight;
                const samePage = paper.dataset.page === String(page);
                const zoomChanged = paper.dataset.zoom !== String(zoom);
                const previousLeft = viewportElement.scrollLeft;
                const previousTop = viewportElement.scrollTop;
                const centerX = viewportElement.scrollLeft + viewportElement.clientWidth / 2;
                const centerY = viewportElement.scrollTop + viewportElement.clientHeight / 2;
                paper.style.width = `${viewport.width}px`;
                paper.style.height = `${viewport.height}px`;
                paper.dataset.page = String(page);
                paper.dataset.zoom = String(zoom);
                paper.replaceChildren(canvas, text);
                if (samePage && previousWidth && previousHeight) {
                    // Zoom keeps the reading center; resizing/fullscreen keeps
                    // the top of the visible text rather than jumping down it.
                    viewportElement.scrollLeft = zoomChanged
                        ? centerX * viewport.width / previousWidth - viewportElement.clientWidth / 2
                        : previousLeft * viewport.width / previousWidth;
                    viewportElement.scrollTop = zoomChanged
                        ? centerY * viewport.height / previousHeight - viewportElement.clientHeight / 2
                        : previousTop * viewport.height / previousHeight;
                } else {
                    viewportElement.scrollTo({top: 0, left: 0, behavior: 'instant'});
                }
                setRendered({page, zoom, fit});
                setError(false);
            } catch (cause) {
                if (!disposed && current === generation && !(cause instanceof Error && cause.name === 'RenderingCancelledException')) {
                    setError(true);
                }
            }
        };
        const schedule = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => { void render(); }, 100);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(viewportElement);
        window.addEventListener('resize', schedule);
        void render();
        return () => {
            disposed = true;
            generation++;
            task?.cancel();
            textLayer?.cancel();
            observer.disconnect();
            window.removeEventListener('resize', schedule);
            window.clearTimeout(resizeTimer);
        };
    }, [document, page, zoom, fit]);

    const changePage = (offset: number) => setPage((current) => Math.max(1, Math.min(document?.numPages ?? 1, current + offset)));
    const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key === 'ArrowRight') changePage(1);
        else if (event.key === 'ArrowLeft') changePage(-1);
        else if (event.key === '+' || event.key === '=') setZoom((value) => clampZoom(value + 0.2));
        else if (event.key === '-') setZoom((value) => clampZoom(value - 0.2));
        else if (event.key === '0') setZoom(1);
        else return;
        event.preventDefault();
    };
    const download = () => {
        const link = window.document.createElement('a');
        link.href = src;
        link.download = downloadName ?? 'document.pdf';
        link.click();
    };

    return (
        <div className="pdf-container" ref={rootRef}>
            <div className="pdf-toolbar">
                <div className="pdf-document-title"><span className="pdf-document-icon"><FontAwesomeIcon icon={faFilePdf}/></span><div><strong>{t('resume.documentTitle')}</strong><span>Matteo Tatoni · {documentLanguage}</span></div></div>
                <div className="pdf-tools">
                    <a className="pdf-btn" href={src} target="_blank" rel="noopener noreferrer" aria-label={t('resume.openOriginal')} title={t('resume.openOriginal')}><FontAwesomeIcon icon={faUpRightFromSquare}/></a>
                    <button type="button" className="pdf-btn pdf-fullscreen" disabled={!window.document.fullscreenEnabled} onClick={() => { void toggleFullscreen(); }} aria-label={t(fullscreen ? 'resume.exitFullscreen' : 'resume.fullscreen')} title={t(fullscreen ? 'resume.exitFullscreen' : 'resume.fullscreen')}><FontAwesomeIcon icon={fullscreen ? faCompress : faExpand}/></button>
                    <button type="button" className="pdf-btn pdf-download" onClick={download} aria-label={t('resume.download')} title={t('resume.download')}><FontAwesomeIcon icon={faDownload}/></button>
                </div>
            </div>
            <div className="pdf-viewer" ref={viewportRef} role="region" aria-label={t('resume.preview')} tabIndex={0} onKeyDown={handleKeyboard} aria-busy={busy}>
                <div className="pdf-stage" ref={stageRef}>
                    <div className="pdf-page" ref={paperRef} role="group" aria-label={t('resume.pageLabel', {page, total: document?.numPages ?? 0})}/>
                </div>
                {!rendered.page && !error && <div className="pdf-loader" role="status"><div className="spinner"/><span>{t('resume.loading')}</span></div>}
                {error && <div className="pdf-loader pdf-error" role="alert"><FontAwesomeIcon icon={faFilePdf}/><span>{t('resume.error')}</span><a href={src} target="_blank" rel="noopener noreferrer">{t('resume.openOriginal')}</a></div>}
            </div>
            <div className={`pdf-render-progress ${busy ? 'is-busy' : ''}`} aria-hidden="true"/>
            <div className="pdf-controls">
                <div className="pdf-nav">
                    <button type="button" className="pdf-btn" onClick={() => changePage(-1)} disabled={!document || page === 1} aria-label={t('resume.previousPage')}><FontAwesomeIcon icon={faChevronLeft}/></button>
                    <span className="pdf-page-info" aria-live="polite">{document ? `${page} / ${document.numPages}` : '– / –'}</span>
                    <button type="button" className="pdf-btn" onClick={() => changePage(1)} disabled={!document || page === document.numPages} aria-label={t('resume.nextPage')}><FontAwesomeIcon icon={faChevronRight}/></button>
                </div>
                <div className="pdf-tools">
                    <button type="button" className="pdf-btn" onClick={() => setZoom((value) => clampZoom(value - 0.2))} disabled={!document || zoom <= 0.5} aria-label={t('resume.zoomOut')}><FontAwesomeIcon icon={faMinus}/></button>
                    <button type="button" className="pdf-btn pdf-zoom" onClick={() => setZoom(1)} disabled={!document} aria-label={t('resume.resetZoom')} title={t('resume.resetZoom')}>{Math.round(zoom * 100)}%</button>
                    <button type="button" className="pdf-btn" onClick={() => setZoom((value) => clampZoom(value + 0.2))} disabled={!document || zoom >= 3} aria-label={t('resume.zoomIn')}><FontAwesomeIcon icon={faPlus}/></button>
                    <button type="button" className="pdf-btn" onClick={() => { setFit(fit === 'width' ? 'page' : 'width'); setZoom(1); }} disabled={!document} aria-label={t(fit === 'width' ? 'resume.fitPage' : 'resume.fitWidth')} title={t(fit === 'width' ? 'resume.fitPage' : 'resume.fitWidth')}><FontAwesomeIcon icon={fit === 'width' ? faCompress : faArrowsLeftRight}/></button>
                </div>
            </div>
        </div>
    );
};
export default PDFViewer;
