import type {
  RemovalOptions,
  ProcessingResult,
  BackgroundRemovalConfig,
} from '../types';
export declare class BackgroundRemover {
  private bodyPixModel;
  constructor(_config?: BackgroundRemovalConfig);
  removeBackground(
    imageBuffer: Buffer,
    options?: RemovalOptions
  ): Promise<ProcessingResult>;
  private removeBackgroundWithRemoveBg;
  private removeBackgroundWithTensorFlow;
  private loadBodyPixModel;
  dispose(): Promise<void>;
}
//# sourceMappingURL=background-remover.d.ts.map
