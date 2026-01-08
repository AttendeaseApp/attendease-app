import { useState } from "react";

const REQUIRED_IMAGES = 5;

export const useCaptureProgress = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const getInstructionText = () => {
    if (currentStep === 0)
      return "Step 1: Face forward - Look directly at the camera";
    if (currentStep === 1) return "Step 2: Turn slightly left";
    if (currentStep === 2) return "Step 3: Turn fully left";
    if (currentStep === 3) return "Step 4: Turn slightly right";
    if (currentStep === 4) return "Step 5: Turn fully right";
    return "REGISTRATION COMPLETE";
  };

  const resetCapture = () => {
    setCapturedImages([]);
    setCurrentStep(0);
  };

  return {
    isProcessing,
    setIsProcessing,
    capturedImages,
    setCapturedImages,
    currentStep,
    setCurrentStep,
    getInstructionText,
    resetCapture,
    REQUIRED_IMAGES,
  };
};
