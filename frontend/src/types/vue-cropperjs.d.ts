declare module 'vue-cropperjs' {
  import { DefineComponent } from 'vue'
  import 'cropperjs'

  interface CropperOptions {
    viewMode?: number;
    dragMode?: 'crop' | 'move' | 'none';
    initialAspectRatio?: number;
    aspectRatio?: number;
    data?: object;
    preview?: string | Element | Element[] | NodeList;
    responsive?: boolean;
    restore?: boolean;
    checkCrossOrigin?: boolean;
    checkOrientation?: boolean;
    modal?: boolean;
    guides?: boolean;
    center?: boolean;
    highlight?: boolean;
    background?: boolean;
    autoCrop?: boolean;
    autoCropArea?: number;
    movable?: boolean;
    rotatable?: boolean;
    scalable?: boolean;
    zoomable?: boolean;
    zoomOnTouch?: boolean;
    zoomOnWheel?: boolean;
    wheelZoomRatio?: number;
    cropBoxMovable?: boolean;
    cropBoxResizable?: boolean;
    toggleDragModeOnDblclick?: boolean;
    minContainerWidth?: number;
    minContainerHeight?: number;
    minCanvasWidth?: number;
    minCanvasHeight?: number;
    minCropBoxWidth?: number;
    minCropBoxHeight?: number;
  }

  interface CropperMethods {
    crop(): void;
    reset(): void;
    clear(): void;
    replace(url: string, onlyColorChanged?: boolean): void;
    enable(): void;
    disable(): void;
    destroy(): void;
    move(offsetX: number, offsetY?: number): void;
    moveTo(x: number, y?: number): void;
    zoom(ratio: number): void;
    zoomTo(ratio: number, pivot?: { x: number; y: number }): void;
    rotate(degree: number): void;
    rotateTo(degree: number): void;
    scale(scaleX: number, scaleY?: number): void;
    getData(rounded?: boolean): object;
    setData(data: object): void;
    getContainerData(): object;
    getImageData(): object;
    getCanvasData(): object;
    setCanvasData(data: object): void;
    getCropBoxData(): object;
    setCropBoxData(data: object): void;
    getCroppedCanvas(options?: object): HTMLCanvasElement;
    setAspectRatio(aspectRatio: number): void;
    setDragMode(mode?: 'crop' | 'move' | 'none'): void;
  }

  interface CropperProps {
    src: string;
    alt?: string;
    imgStyle?: object;
    dragMode?: 'crop' | 'move' | 'none';
    responsive?: boolean;
    restore?: boolean;
    checkCrossOrigin?: boolean;
    checkOrientation?: boolean;
    modal?: boolean;
    guides?: boolean;
    center?: boolean;
    highlight?: boolean;
    background?: boolean;
    autoCrop?: boolean;
    autoCropArea?: number;
    movable?: boolean;
    rotatable?: boolean;
    scalable?: boolean;
    zoomable?: boolean;
    zoomOnTouch?: boolean;
    zoomOnWheel?: boolean;
    wheelZoomRatio?: number;
    cropBoxMovable?: boolean;
    cropBoxResizable?: boolean;
    toggleDragModeOnDblclick?: boolean;
    minContainerWidth?: number;
    minContainerHeight?: number;
    minCanvasWidth?: number;
    minCanvasHeight?: number;
    minCropBoxWidth?: number;
    minCropBoxHeight?: number;
    ready?: () => void;
    cropstart?: () => void;
    cropmove?: () => void;
    cropend?: () => void;
    crop?: () => void;
    zoom?: () => void;
  }

  const VueCropper: DefineComponent<CropperProps> & CropperMethods;
  export default VueCropper;
}