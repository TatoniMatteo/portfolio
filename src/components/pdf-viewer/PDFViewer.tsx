import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faChevronLeft,
    faChevronRight,
    faDownload, faPlus, faMinus
} from "@fortawesome/free-solid-svg-icons";
import * as pdfjsLib from "pdfjs-dist";
import {GlobalWorkerOptions} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
import "pdfjs-dist/web/pdf_viewer.css";
import "./PDFViewer.css";

GlobalWorkerOptions.workerSrc = workerSrc;

const PDFViewer = ({src, downloadName}: { src: string; downloadName?: string }) => {
    const {t} = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(false);
    const dragStart = useRef({x: 0, y: 0});

    // Carica PDF
    useEffect(() => {
        let cancelled = false;

        const loadPdf = async () => {
            try {
                // pdfjs-dist v6: getDocument non accetta più una stringa
                // diretta, va passato un oggetto { url }.
                const pdf = await pdfjsLib.getDocument({url: src}).promise;
                if (cancelled) return;
                setPdfDoc(pdf);
                setPageNum(1); // es. cambio lingua: si riparte dalla prima pagina
                setError(false);
            } catch (e) {
                if (cancelled) return;
                console.error("Errore nel caricamento del PDF:", e);
                setError(true);
            }
        };
        loadPdf();

        return () => {
            cancelled = true;
        };
    }, [src]);

    // Renderizza PDF
    useEffect(() => {
        if (!pdfDoc) return;

        let renderTask: pdfjsLib.RenderTask | null = null;
        let resizeTimeout: number | undefined;

        const renderPage = async () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const page = await pdfDoc.getPage(pageNum);

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const viewport = page.getViewport({scale: 1});
            const widthRatio = containerWidth / viewport.width;
            const heightRatio = containerHeight / viewport.height;

            const fitScale = Math.min(widthRatio, heightRatio);

            const finalScale = fitScale * scale;
            const scaledViewport = page.getViewport({scale: finalScale});

            const outputScale = window.devicePixelRatio || 1;
            canvas.width = scaledViewport.width * outputScale;
            canvas.height = scaledViewport.height * outputScale;
            canvas.style.width = `${scaledViewport.width}px`;
            canvas.style.height = `${scaledViewport.height}px`;

            ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
            ctx.clearRect(0, 0, scaledViewport.width, scaledViewport.height);

            if (renderTask) renderTask.cancel();

            renderTask = page.render({
                canvasContext: ctx,
                viewport: scaledViewport,
                canvas,
            });

            try {
                await renderTask.promise;
            } catch (e) {
                if ((e as Error).name !== "RenderingCancelledException") {
                    console.error("Errore nel rendering PDF:", e);
                }
            }

            // Reset posizione dopo resize o page change
            setPosition({x: 0, y: 0});
        };

        renderPage();

        const handleResize = () => {
            if (resizeTimeout) window.clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(renderPage, 250);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            if (renderTask) renderTask.cancel();
            window.removeEventListener("resize", handleResize);
            if (resizeTimeout) window.clearTimeout(resizeTimeout);
        };
    }, [pdfDoc, pageNum, scale]);

    // Calcola i limiti del pan per non uscire dal documento
    const getPanBounds = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return {minX: 0, maxX: 0, minY: 0, maxY: 0};

        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const extraX = Math.max(0, canvasRect.width - containerRect.width);
        const extraY = Math.max(0, canvasRect.height - containerRect.height);

        return {
            minX: -extraX / 2,
            maxX: extraX / 2,
            minY: -extraY / 2,
            maxY: extraY / 2,
        };
    };

    // Gestione drag limitato
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const bounds = getPanBounds();

        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;

        const clampedX = Math.min(Math.max(newX, bounds.minX), bounds.maxX);
        const clampedY = Math.min(Math.max(newY, bounds.minY), bounds.maxY);

        setPosition({x: clampedX, y: clampedY});
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = src;
        link.download = downloadName ?? (src.split("/").pop() || "document.pdf");
        link.click();
    };

    return (
        <div className="pdf-container">
            <div
                className="pdf-viewer"
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        cursor: isDragging ? "grabbing" : "grab",
                    }}
                />
            </div>

            <div className="pdf-controls">
                <div className="pdf-nav">
                    <button
                        className="pdf-btn"
                        onClick={() => setPageNum(pageNum > 1 ? pageNum - 1 : pageNum)}
                        disabled={!pdfDoc || pageNum === 1}
                    >
                        <FontAwesomeIcon icon={faChevronLeft}/>
                    </button>

                    <span className="pdf-page-info">
            {pdfDoc ? `${pageNum} / ${pdfDoc.numPages}` : "– / –"}
          </span>

                    <button
                        className="pdf-btn"
                        onClick={() =>
                            setPageNum(pageNum < (pdfDoc?.numPages || 1) ? pageNum + 1 : pageNum)
                        }
                        disabled={!pdfDoc || pageNum === pdfDoc?.numPages}
                    >
                        <FontAwesomeIcon icon={faChevronRight}/>
                    </button>
                </div>

                <div className="pdf-tools">
                    <button
                        className="pdf-btn"
                        onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
                        disabled={scale <= 0.5}
                        title="Zoom Out"
                    >
                        <FontAwesomeIcon icon={faMinus}/>
                    </button>

                    <button
                        className="pdf-btn"
                        onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                        disabled={scale >= 3}
                        title="Zoom In"
                    >
                        <FontAwesomeIcon icon={faPlus}/>
                    </button>

                    <button className="pdf-btn" onClick={handleDownload} title="Download PDF">
                        <FontAwesomeIcon icon={faDownload}/>
                    </button>
                </div>
            </div>

            {!pdfDoc && !error && (
                <div className="pdf-loader">
                    <div className="spinner"/>
                    <span>{t('resume.loading')}</span>
                </div>
            )}

            {error && (
                <div className="pdf-loader" role="alert">
                    <span>{t('resume.error')}</span>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
