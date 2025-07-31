
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';

interface DrawingCanvasProps {
    width: number;
    height: number;
    className?: string;
    backgroundColor?: string;
}

export interface DrawingCanvasRef {
    getImageDataUrl: () => string;
    clear: () => void;
    isCanvasBlank: () => boolean;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ width, height, className, backgroundColor = '#FFFFFF' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawing = useRef(false);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (canvas && context) {
            context.fillStyle = backgroundColor;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [backgroundColor]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        context.lineCap = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        contextRef.current = context;
        clearCanvas();
    }, [clearCanvas, width, height]);

    const getCoords = (event: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };
        const rect = canvas.getBoundingClientRect();
        if ('clientX' in event) { // MouseEvent
            return { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
        }
        if (event.touches && event.touches.length > 0) { // TouchEvent
            return { offsetX: event.touches[0].clientX - rect.left, offsetY: event.touches[0].clientY - rect.top };
        }
        return { offsetX: 0, offsetY: 0 };
    }

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const { offsetX, offsetY } = getCoords(event.nativeEvent);
        contextRef.current?.beginPath();
        contextRef.current?.moveTo(offsetX, offsetY);
        isDrawing.current = true;
    };

    const finishDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        contextRef.current?.closePath();
        isDrawing.current = false;
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        event.preventDefault();
        const { offsetX, offsetY } = getCoords(event.nativeEvent);
        contextRef.current?.lineTo(offsetX, offsetY);
        contextRef.current?.stroke();
    };

    useImperativeHandle(ref, () => ({
        getImageDataUrl: () => {
            return canvasRef.current?.toDataURL('image/png') || '';
        },
        clear: () => {
            clearCanvas();
        },
        isCanvasBlank: () => {
            const canvas = canvasRef.current;
            if (!canvas) return true;
            
            const blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            const blankCtx = blank.getContext('2d');
            if (!blankCtx) return true;

            blankCtx.fillStyle = backgroundColor;
            blankCtx.fillRect(0, 0, blank.width, blank.height);
            
            return canvas.toDataURL() === blank.toDataURL();
        },
    }));

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={finishDrawing}
            onTouchMove={draw}
            className={className}
        />
    );
});

export default DrawingCanvas;
