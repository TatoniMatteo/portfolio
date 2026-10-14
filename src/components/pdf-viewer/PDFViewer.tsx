import type {MouseEvent} from "react";
import {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight, faDownload, faMinus, faPlus,} from "@fortawesome/free-solid-svg-icons";
import * as pdfjsLib from "pdfjs-dist";
import {GlobalWorkerOptions} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";
import "pdfjs-dist/web/pdf_viewer.css";
import "./PDFViewer.css";

GlobalWorkerOptions.workerSrc = workerSrc;

const isRenderingCancelled = (error: unknown): boolean =>
    error instanceof Error && error.name === "RenderingCancelledException";

interface PDFViewerProps {
    src: string;
    downloadName?: string;
}

const PDFViewer = ({src, downloadName}: PDFViewerProps) => {
    const {t} = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(false);
    const dragStart = useRef({x: 0, y: 0});

    useEffect(() => {
        let cancelled = false;
        const loadingTask = pdfjsLib.getDocument({url: src});

        const loadPdf = async (): Promise<void> => {
            try {
                const pdf = await loadingTask.promise;

                if (cancelled) {
                    return;
                }

                setPdfDoc(pdf);
                setPageNum(1);
                setError(false);
            } catch (cause: unknown) {
                if (cancelled) {
                    return;
                }

                console.error("Errore nel caricamento del PDF:", cause);
                setError(true);
            }
        };

        void loadPdf();

        return () => {
            cancelled = true;
            void loadingTask.destroy().catch(() => undefined);
        };
    }, [src]);

    useEffect(() => {
        if (!pdfDoc) {
            return () => undefined;
        }

        let cancelled = false;
        let renderTask: pdfjsLib.RenderTask | null = null;
        let resizeTimeout: number | undefined;
        let renderGeneration = 0;

        const renderPage = async (): Promise<void> => {
            const generation = ++renderGeneration;

            renderTask?.cancel();
            renderTask = null;

            try {
                const canvas = canvasRef.current;
                const container = containerRef.current;

                if (!canvas || !container) {
                    return;
                }

                const context = canvas.getContext("2d");

                if (!context) {
                    return;
                }

                const page = await pdfDoc.getPage(pageNum);

                if (cancelled || generation !== renderGeneration) {
                    return;
                }

                const viewport = page.getViewport({scale: 1});
                const widthRatio = container.clientWidth / viewport.width;
                const heightRatio = container.clientHeight / viewport.height;
                const fitScale = Math.min(widthRatio, heightRatio);
                const scaledViewport = page.getViewport({scale: fitScale * scale});
                const outputScale = window.devicePixelRatio || 1;

                canvas.width = Math.floor(scaledViewport.width * outputScale);
                canvas.height = Math.floor(scaledViewport.height * outputScale);
                canvas.style.width = `${scaledViewport.width}px`;
                canvas.style.height = `${scaledViewport.height}px`;

                context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
                context.clearRect(0, 0, scaledViewport.width, scaledViewport.height);

                const task = page.render({
                    canvasContext: context,
                    viewport: scaledViewport,
                    canvas,
                });

                renderTask = task;
                await task.promise;

                if (!cancelled && generation === renderGeneration) {
                    setPosition({x: 0, y: 0});
                }
            } catch (cause: unknown) {
                if (!cancelled && !isRenderingCancelled(cause)) {
                    console.error("Errore nel rendering PDF:", cause);
                }
            }
        };

        const handleResize = (): void => {
            if (resizeTimeout !== undefined) {
                window.clearTimeout(resizeTimeout);
            }

            resizeTimeout = window.setTimeout(() => {
                void renderPage();
            }, 250);
        };

        void renderPage();
        window.addEventListener("resize", handleResize);

        return () => {
            cancelled = true;
            renderGeneration++;
            renderTask?.cancel();
            window.removeEventListener("resize", handleResize);

            if (resizeTimeout !== undefined) {
                window.clearTimeout(resizeTimeout);
            }
        };
    }, [pdfDoc, pageNum, scale]);

    const getPanBounds = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container) {
            return {minX: 0, maxX: 0, minY: 0, maxY: 0};
        }

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

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>): void => {
        setIsDragging(true);
        dragStart.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
        };
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>): void => {
        if (!isDragging) {
            return;
        }

        const bounds = getPanBounds();
        const newX = event.clientX - dragStart.current.x;
        const newY = event.clientY - dragStart.current.y;

        setPosition({
            x: Math.min(Math.max(newX, bounds.minX), bounds.maxX),
            y: Math.min(Math.max(newY, bounds.minY), bounds.maxY),
        });
    };

    const handleMouseUp = (): void => {
        setIsDragging(false);
    };

    const handleDownload = (): void => {
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
                        onClick={() => setPageNum((current) => Math.max(1, current - 1))}
                        disabled={!pdfDoc || pageNum === 1}
                        aria-label={t("resume.previousPage", "Pagina precedente")}
                    >
                        <FontAwesomeIcon icon={faChevronLeft}/>
                    </button>

                    <span className="pdf-page-info">
                        {pdfDoc ? `${pageNum} / ${pdfDoc.numPages}` : "– / –"}
                    </span>

                    <button
                        className="pdf-btn"
                        onClick={() =>
                            setPageNum((current) => Math.min(pdfDoc?.numPages ?? 1, current + 1))
                        }
                        disabled={!pdfDoc || pageNum === pdfDoc.numPages}
                        aria-label={t("resume.nextPage", "Pagina successiva")}
                    >
                        <FontAwesomeIcon icon={faChevronRight}/>
                    </button>
                </div>

                <div className="pdf-tools">
                    <button
                        className="pdf-btn"
                        onClick={() => setScale((current) => Math.max(current - 0.2, 0.5))}
                        disabled={scale <= 0.5}
                        title="Zoom Out"
                        aria-label={t("resume.zoomOut", "Riduci zoom")}
                    >
                        <FontAwesomeIcon icon={faMinus}/>
                    </button>

                    <button
                        className="pdf-btn"
                        onClick={() => setScale((current) => Math.min(current + 0.2, 3))}
                        disabled={scale >= 3}
                        title="Zoom In"
                        aria-label={t("resume.zoomIn", "Aumenta zoom")}
                    >
                        <FontAwesomeIcon icon={faPlus}/>
                    </button>

                    <button
                        className="pdf-btn"
                        onClick={handleDownload}
                        title="Download PDF"
                        aria-label={t("resume.download", "Scarica PDF")}
                    >
                        <FontAwesomeIcon icon={faDownload}/>
                    </button>
                </div>
            </div>

            {!pdfDoc && !error && (
                <div className="pdf-loader">
                    <div className="spinner"/>
                    <span>{t("resume.loading")}</span>
                </div>
            )}

            {error && (
                <div className="pdf-loader" role="alert">
                    <span>{t("resume.error")}</span>
                </div>
            )}
        </div>
    );
};

export default PDFViewer;
