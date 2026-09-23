/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  SwitchCamera,
  ExternalLink,
  CameraOff,
  Image as ImageIcon,
  Smartphone,
} from 'lucide-react';
import { analyzeImageQuality, QualityCheckResult } from '../utils/imageQuality';
import { resizeImageForUpload } from '../utils/imageResize';
import { SAMPLE_PRESCRIPTIONS, SamplePrescription } from '../data/samplePrescriptions';
import { AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface CaptureStepProps {
  onImageCaptured: (base64Image: string, promptHint?: string) => Promise<void>;
  isLoading: boolean;
  loadingMessage: string;
  language?: AppLanguage;
}

interface CameraErrorInfo {
  message: string;
  isPermissionDenied: boolean;
  isIframe: boolean;
}

export default function CaptureStep({
  onImageCaptured,
  isLoading,
  loadingMessage,
  language = 'hi',
}: CaptureStepProps) {
  const t = getTranslations(language);
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qualityCheck, setQualityCheck] = useState<QualityCheckResult | null>(null);
  const [qualityWarningIgnored, setQualityWarningIgnored] = useState(false);
  const [activeSample, setActiveSample] = useState<SamplePrescription | null>(null);
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsVideoReady(false);
    setIsStartingCamera(false);
  }, []);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Synchronize video element when stream or cameraActive changes
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video
        .play()
        .then(() => setIsVideoReady(true))
        .catch((err) => {
          console.warn('Video play caught in effect:', err);
        });
    }
  }, [cameraActive]);

  // Start live in-app camera with multi-tiered fallback
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsStartingCamera(true);
    setIsVideoReady(false);

    // Stop any existing tracks first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const isIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!navigator?.mediaDevices?.getUserMedia) {
      setIsStartingCamera(false);
      setCameraError({
        message:
          language === 'hi'
            ? 'आपके ब्राउज़र में डायरेक्ट कैमरा सपोर्ट उपलब्ध नहीं है। कृपया नीचे "फोन कैमरे से फोटो लें" या "गैलरी से चुनें" का उपयोग करें।'
            : 'Direct browser camera is not supported. Please use the "Phone Camera" or "Upload" button below.',
        isPermissionDenied: false,
        isIframe,
      });
      return;
    }

    let stream: MediaStream | null = null;
    let lastError: any = null;

    // Tier 1: Try requested facing mode with ideal resolution
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      lastError = err1;
      console.warn('Tier 1 camera constraints failed, attempting Tier 2:', err1);

      // Tier 2: Try requested facing mode without resolution constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: false,
        });
      } catch (err2) {
        lastError = err2;
        console.warn('Tier 2 camera constraints failed, attempting Tier 3 (generic video):', err2);

        // Tier 3: Try any available camera device (webcam, laptop camera, virtual camera)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3) {
          lastError = err3;
          console.warn('Tier 3 generic camera failed:', err3);
        }
      }
    }

    if (!stream) {
      setIsStartingCamera(false);
      setCameraActive(false);

      const errName = lastError?.name || '';
      const isPermissionDenied =
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        lastError?.message?.toLowerCase().includes('permission');

      let userMsg = '';
      if (isPermissionDenied) {
        userMsg =
          language === 'hi'
            ? 'कैमरे की अनुमति (Camera Permission) अस्वीकार कर दी गई है। आप नीचे "फोन कैमरे से फोटो लें" बटन से सीधे अपने डिवाइस का कैमरा खोल सकते हैं, या ब्राउज़र सेटिंग्स में अनुमति दें।'
            : 'Camera permission was denied. You can still tap "Phone Camera" below to capture directly with your device camera.';
      } else {
        userMsg =
          language === 'hi'
            ? 'लाइव कैमरा शुरू नहीं हो सका (हो सकता है कैमरा किसी अन्य ऐप में खुला हो या सैंडबॉक्स में हो)। आप नीचे "फोन कैमरे से फोटो लें" बटन का उपयोग कर सकते हैं।'
            : 'Unable to start in-app live camera. You can use the "Phone Camera" button below to open your device camera.';
      }

      setCameraError({
        message: userMsg,
        isPermissionDenied,
        isIframe,
      });
      return;
    }

    streamRef.current = stream;
    setFacingMode(targetFacing);
    setCameraActive(true);
    setIsStartingCamera(false);

    // If video element is already in DOM, assign immediately
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .then(() => setIsVideoReady(true))
        .catch((e) => console.warn('Video play immediate error:', e));
    }
  };

  // Flip between front and rear cameras
  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(nextFacing);
  };

  // Capture frame from active video stream
  const captureFrameFromVideo = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    let width = video.videoWidth || video.clientWidth || 800;
    let height = video.videoHeight || video.clientHeight || 600;

    const maxDim = 1600;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

    stopCamera();
    processCapturedImage(dataUrl);
  };

  // Handle file selection from gallery or file system
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Downscale using HTML5 canvas to max 1600px with 0.7 JPEG quality
      const resizedDataUrl = await resizeImageForUpload(file, 1600, 1600, 0.7);
      processCapturedImage(resizedDataUrl);
    } catch (err) {
      console.warn('Image downscaling failed, falling back to FileReader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        processCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }

    // Reset input so re-selecting the same file works
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      // Downscale using HTML5 canvas to max 1600px with 0.7 JPEG quality
      const resizedDataUrl = await resizeImageForUpload(file, 1600, 1600, 0.7);
      processCapturedImage(resizedDataUrl);
    } catch (err) {
      console.warn('Image downscaling failed on drop, falling back:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        processCapturedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open the page in a new window/tab to bypass iframe permission blocks
  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  // Process captured image and run client-side quality check
  const processCapturedImage = async (dataUrl: string, promptHint?: string) => {
    // Ensure final image is bounded within 1600px / 0.7 quality
    const boundedDataUrl = dataUrl.length > 400000 
      ? await resizeImageForUpload(dataUrl, 1600, 1600, 0.7) 
      : dataUrl;

    setSelectedImage(boundedDataUrl);
    setQualityWarningIgnored(false);
    setCameraError(null);

    // Run client-side quality check
    const result = await analyzeImageQuality(boundedDataUrl);
    setQualityCheck(result);

    // If quality is good, proceed straight to clinical extraction
    if (result.passed) {
      await onImageCaptured(boundedDataUrl, promptHint);
    }
  };

  const proceedWithCurrentQuality = async () => {
    if (!selectedImage) return;
    setQualityWarningIgnored(true);
    await onImageCaptured(selectedImage, activeSample?.rawTextPrompt);
  };

  const retakePhoto = () => {
    setSelectedImage(null);
    setQualityCheck(null);
    setQualityWarningIgnored(false);
    setActiveSample(null);
    startCamera();
  };

  // Convert a sample prescription into a readable image snapshot on a canvas
  const handleSelectSample = (sample: SamplePrescription) => {
    setActiveSample(sample);
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 720, 960);

    // Doctor clinic header
    ctx.fillStyle = '#2A7C13';
    ctx.fillRect(0, 0, 720, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(sample.doctor, 36, 45);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#FFF8CF';
    ctx.fillText(`${sample.specialty} • ${sample.clinic}`, 36, 75);

    // Patient info banner
    ctx.fillStyle = '#FBE6C2';
    ctx.fillRect(36, 130, 648, 54);
    ctx.fillStyle = '#1E5C0D';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Pt: ${sample.patient} (${sample.ageGender})`, 50, 162);
    ctx.fillText(`Date: ${sample.date}`, 520, 162);

    // Rx symbol
    ctx.fillStyle = '#2A7C13';
    ctx.font = 'italic bold 36px serif';
    ctx.fillText('℞', 42, 235);

    // Doctor diagnosis / notes
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Diagnosis / Complaints: ${sample.notes}`, 90, 232);

    // Handwritten medicine lines simulation
    ctx.fillStyle = '#0f172a';
    ctx.font = '19px monospace';
    sample.handwrittenLines.forEach((line, index) => {
      ctx.fillText(line, 55, 295 + index * 52);
    });

    // Stamp & signature
    ctx.strokeStyle = '#2A7C13';
    ctx.lineWidth = 2;
    ctx.strokeRect(460, 780, 220, 90);
    ctx.fillStyle = '#2A7C13';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('VERIFIED CONSULTANT', 490, 810);
    ctx.fillText('REG: 48291 / MCI', 510, 835);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    processCapturedImage(dataUrl, sample.rawTextPrompt);
  };

  return (
    <div id="paricharya-capture-container" className="space-y-6">
      {/* Intro Hero card */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-dark rounded-3xl p-6 text-white shadow-xl border border-accent/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-dark/80 border border-accent/50 flex items-center justify-center shrink-0 text-cream shadow-inner">
            <Camera className="w-6 h-6 text-cream" />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight text-white ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.capture.title}
            </h1>
            <p className={`text-sm text-cream/90 mt-1 leading-relaxed ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.capture.subtitle}
            </p>
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-accent/30 text-[11px] text-cream font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sand shrink-0" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>
              {language === 'hi' ? 'सरल हिंदी में' : 'Clear English'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sand shrink-0" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>
              {language === 'hi' ? 'दवाई के चित्र' : 'Medicine Icons'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sand shrink-0" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>
              {language === 'hi' ? 'सुरक्षा जांच' : 'Safety Check'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-3xl p-5 shadow-sm border transition-all ${
          isDragging ? 'border-primary ring-4 ring-accent/20 bg-cream/30' : 'border-slate-200'
        }`}
      >
        {/* Loading overlay when Gemini API is analyzing image */}
        {isLoading && (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-accent/30 animate-ping opacity-25"></div>
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Sparkles className="w-6 h-6 text-sand-dark absolute" />
            </div>
            <div>
              <h3 className={`text-base font-bold text-slate-800 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {loadingMessage || t.capture.analyzingText}
              </h3>
              <p className={`text-xs text-slate-500 mt-1 max-w-xs mx-auto ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.capture.analyzingSubtext}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream border border-accent/60 text-primary-dark text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {language === 'hi' ? 'Gemini Vision AI सुरक्षित विश्लेषण' : 'Gemini Vision AI Clinical Parsing'}
            </div>
          </div>
        )}

        {/* Live Camera Viewfinder */}
        {!isLoading && cameraActive && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-inner">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play()
                      .then(() => setIsVideoReady(true))
                      .catch((e) => console.warn('Ref callback video play:', e));
                  }
                }}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setIsVideoReady(true)}
                onCanPlay={() => setIsVideoReady(true)}
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Top Controls */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-[11px] font-semibold text-white">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVideoReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {isVideoReady
                      ? language === 'hi'
                        ? 'लाइव कैमरा तैयार'
                        : 'Camera Active'
                      : language === 'hi'
                      ? 'शुरू हो रहा है...'
                      : 'Connecting...'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  id="btn-flip-camera"
                  title={language === 'hi' ? 'कैमरा बदलें (आगे/पीछे)' : 'Flip Camera (Front/Back)'}
                  className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-xs transition flex items-center gap-1 text-xs font-medium"
                >
                  <SwitchCamera className="w-4 h-4 text-sand" />
                  <span className="hidden sm:inline text-[11px]">
                    {facingMode === 'environment' ? 'Front' : 'Back'}
                  </span>
                </button>
              </div>

              {/* Alignment Frame Overlay */}
              <div className="absolute inset-5 border-2 border-dashed border-sand/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-black/70 text-sand self-start">
                  {language === 'hi' ? 'पर्चे को इस फ्रेम में रखें' : 'Align prescription in this frame'}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/70 text-white self-center">
                  {language === 'hi' ? 'पर्याप्त रोशनी रखें • फोन सीधा रखें' : 'Ensure good lighting • Hold flat'}
                </span>
              </div>
            </div>

            {/* Viewfinder Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={captureFrameFromVideo}
                disabled={!isVideoReady}
                id="btn-take-photo"
                className="flex-1 py-3.5 px-4 rounded-2xl bg-primary text-white font-bold text-base shadow-md hover:bg-primary-dark active:scale-98 transition flex items-center justify-center gap-2 min-h-[50px] disabled:opacity-60"
              >
                <Camera className="w-5 h-5 text-sand" />
                <span>{t.capture.capturePhoto}</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                id="btn-cancel-camera"
                className="py-3.5 px-4 rounded-2xl bg-cream hover:bg-sand text-primary-dark font-semibold active:scale-98 transition min-h-[50px] border border-sand"
              >
                {t.capture.cancelCamera}
              </button>
            </div>

            {/* Fallback suggestion inside viewfinder */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  nativeCameraInputRef.current?.click();
                }}
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi'
                    ? 'या फोन के मुख्य कैमरा ऐप से एचडी फोटो खींचें ➔'
                    : 'Or capture using phone native camera app ➔'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Starting Camera Spinner */}
        {!isLoading && isStartingCamera && (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto"></div>
            <p className={`text-sm font-semibold text-slate-700 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {language === 'hi' ? 'कैमरा कनेक्ट किया जा रहा है...' : 'Connecting to camera...'}
            </p>
          </div>
        )}

        {/* Quality Check Warning Dialog */}
        {!isLoading && !cameraActive && selectedImage && qualityCheck && !qualityCheck.passed && !qualityWarningIgnored && (
          <div className="p-4 rounded-2xl bg-cream border border-sand text-amber-950 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#8C4A00] shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-bold text-sm text-amber-950 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? 'फोटो में समस्या दिख रही है (Image Quality Warning)' : 'Image Quality Warning'}
                </h4>
                <p className={`text-xs text-amber-900 mt-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi'
                    ? qualityCheck.hindiWarningMessage || qualityCheck.warningMessage
                    : qualityCheck.warningMessage}
                </p>
                <div className="mt-2 text-[11px] text-amber-900/80 flex gap-4">
                  <span>
                    {language === 'hi' ? 'रोशनी स्कोर:' : 'Brightness:'} {qualityCheck.brightnessScore}/255
                  </span>
                  <span>
                    {language === 'hi' ? 'स्पष्टता स्कोर:' : 'Sharpness:'} {qualityCheck.edgeContrastScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={retakePhoto}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{language === 'hi' ? 'दोबारा साफ फोटो लें' : 'Retake Clear Photo'}</span>
              </button>
              <button
                type="button"
                onClick={proceedWithCurrentQuality}
                className="py-2.5 px-3 rounded-xl bg-white border border-sand text-amber-950 font-semibold text-xs hover:bg-sand/30 transition"
              >
                {language === 'hi' ? 'फिर भी जारी रखें' : 'Continue Anyway'}
              </button>
            </div>
          </div>
        )}

        {/* Default Capture Action Buttons */}
        {!isLoading && !cameraActive && !isStartingCamera && (!selectedImage || (qualityCheck && qualityCheck.passed) || qualityWarningIgnored) && (
          <div className="space-y-4">
            {/* Primary Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: Live In-Browser Camera */}
              <button
                type="button"
                onClick={() => startCamera('environment')}
                id="btn-open-camera"
                className="py-4 px-5 rounded-2xl bg-primary text-white font-bold text-base shadow-md hover:bg-primary-dark active:scale-98 transition flex items-center justify-center gap-3 min-h-[58px]"
              >
                <Camera className="w-6 h-6 text-sand shrink-0" />
                <div className="text-left leading-tight">
                  <div className={`font-bold text-sm sm:text-base ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {language === 'hi' ? 'लाइव कैमरा स्कैनर' : 'Live Camera Scanner'}
                  </div>
                  <div className="text-[11px] font-normal text-cream/90">
                    {language === 'hi' ? 'सीधे स्क्रीन पर देखें' : 'In-app viewfinder'}
                  </div>
                </div>
              </button>

              {/* Button 2: Direct Native Phone Camera */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                id="btn-phone-camera"
                className="py-4 px-5 rounded-2xl bg-cream hover:bg-sand text-primary-dark font-bold text-base border-2 border-accent/70 active:scale-98 transition flex items-center justify-center gap-3 min-h-[58px] shadow-xs"
              >
                <Smartphone className="w-6 h-6 text-primary shrink-0" />
                <div className="text-left leading-tight">
                  <div className={`font-bold text-sm sm:text-base ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {language === 'hi' ? 'फोन कैमरे से फोटो लें' : 'Device Camera Photo'}
                  </div>
                  <div className="text-[11px] font-medium text-primary/80">
                    {language === 'hi' ? 'HD कैमरा ऐप खोलें' : 'Direct Phone Camera'}
                  </div>
                </div>
              </button>
            </div>

            {/* Gallery Upload Strip */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                id="btn-upload-file"
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-accent hover:bg-cream/40 text-slate-700 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>
                  {language === 'hi'
                    ? 'गैलरी या फाइलों से पर्चे की फोटो चुनें'
                    : 'Upload Prescription from Gallery / Files'}
                </span>
              </button>
            </div>

            {/* Hidden Input 1: Native Mobile Camera Capture */}
            <input
              ref={nativeCameraInputRef}
              id="native-camera-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Hidden Input 2: Standard File Picker / Gallery */}
            <input
              ref={fileInputRef}
              id="prescription-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Camera Diagnostics & Resolution Card (if camera failed) */}
            {cameraError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-3 mt-3 animate-fade-in">
                <div className="flex items-start gap-3">
                  <CameraOff className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-rose-900">
                      {language === 'hi' ? 'कैमरा सूचना / Camera Notice' : 'Camera Access Notice'}
                    </h4>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      {cameraError.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-sand" />
                    <span>{language === 'hi' ? 'फोन कैमरे से फोटो लें' : 'Open Device Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-100/50 transition flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-rose-700" />
                    <span>{language === 'hi' ? 'गैलरी से फोटो चुनें' : 'Choose from Gallery'}</span>
                  </button>

                  {cameraError.isIframe && (
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="py-2 px-3 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-semibold hover:bg-rose-100/50 transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-rose-700" />
                      <span>{language === 'hi' ? 'नई टैब में खोलें' : 'Open in New Tab'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startCamera('environment')}
                    className="py-2 px-3 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-semibold hover:bg-rose-100/50 transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Try with Sample Prescriptions Section (Instant Demo) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className={`text-sm font-bold text-slate-800 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.capture.sampleHeader}
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-primary-dark bg-cream px-2 py-0.5 rounded-full border border-accent/50">
            One-Tap Test
          </span>
        </div>
        <p className={`text-xs text-slate-500 ${language === 'hi' ? 'font-devanagari' : ''}`}>
          {t.capture.sampleSubtitle}
        </p>

        <div className="space-y-2.5 pt-1">
          {SAMPLE_PRESCRIPTIONS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={isLoading}
              className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-accent hover:bg-cream/40 text-left transition flex items-center justify-between group disabled:opacity-50"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{sample.doctor}</span>
                  <span className="text-[10px] text-primary-dark bg-sand/60 px-1.5 py-0.5 rounded font-medium">
                    {sample.ageGender}
                  </span>
                </div>
                <div className={`text-xs text-primary-dark font-medium ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {sample.notes}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {sample.handwrittenLines[0]?.slice(0, 40)}...
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary shrink-0 transition" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
