import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IoCameraOutline } from 'react-icons/io5';

const GoogleSheet = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [currentStep, setCurrentStep] = useState(1);
  const webcamRef = useRef(null);

  const startCamera = () => {
    setError('');
    setShowCamera(true);
    setCurrentStep(2);
  };

  const stopCamera = () => {
    setShowCamera(false);
    setCurrentStep(1);
    setCapturedImage(null);
    setExtractedData(null);
    setError('');
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();

      if (imageSrc) {
        setCapturedImage(imageSrc);
        setShowCamera(false);
        setExtractedData(null);
        setError('');
        setCurrentStep(3);
        console.log('Photo captured with react-webcam');
      } else {
        setError('Failed to capture photo. Please try again.');
      }
    } else {
      setError('Camera not available for capture');
    }
  }, [webcamRef]);

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

  const extractBusinessCard = async () => {
    if (!capturedImage) {
      setError('Please capture a photo first!');
      return;
    }

    setIsProcessing(true);
    setError('');
    let responseText = '';

    try {
      // Initialize Google Generative AI
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          candidateCount: 1
        }
      });

      // Convert base64 to get the image data
      const base64Data = capturedImage.split(',')[1];
      const mimeType = capturedImage.split(';')[0].split(':')[1];

      const prompt = `
Analyze this business card and extract the following information in proper JSON format:

{
  "company_name": "",
  "phone_number": "",
  "email": "",
  "contact_person_name": "",
  "website_url": "",
  "address": ""
}

STRICTLY RETURN ONLY JSON with no extra text. If any field is not found, return empty string.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);

      const responseText = result.response.text();
      let cleanJson = responseText.replace(/```json|```/g, "").trim();

      // Additional cleaning to handle common JSON parsing issues
      cleanJson = cleanJson.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove control characters
      cleanJson = cleanJson.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"); // Escape newlines and tabs

      // Try to extract JSON if it's wrapped in extra text
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }

      // Fix common JSON formatting issues
      cleanJson = cleanJson.replace(/(\w+):/g, '"$1":'); // Add quotes to unquoted property names
      cleanJson = cleanJson.replace(/:\s*([^",\[\]\{\}][^",\[\]\{\}]*?)([,\]\}])/g, ': "$1"$2'); // Add quotes to unquoted string values

      console.log('Cleaned JSON:', cleanJson);

      let extractedData;
      try {
        extractedData = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('JSON parse failed, attempting manual extraction');
        // Fallback: try to extract data manually
        extractedData = {
          company_name: '',
          phone_number: '',
          email: '',
          contact_person_name: '',
          website_url: '',
          address: ''
        };

        // Try to extract individual fields using regex
        const fields = ['company_name', 'phone_number', 'email', 'contact_person_name', 'website_url', 'address'];
        fields.forEach(field => {
          const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i');
          const match = cleanJson.match(regex);
          if (match) {
            extractedData[field] = match[1];
          }
        });
      }

      setExtractedData(extractedData);

    } catch (error) {
      console.error('Error extracting business card:', error);
      console.error('Response text:', responseText);

      if (error instanceof SyntaxError) {
        setError('Invalid response format from AI. Please try again.');
      } else {
        setError('Error processing business card. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setError('');
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-800">Business Card Scanner</h1>


        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Camera Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          {/* Step 1: Initial State */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <div className="size-26 mx-auto border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <IoCameraOutline className="size-16 text-gray-600" />
                </div>
              </div>
              <button
                onClick={startCamera}
                className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 mx-auto text-sm sm:text-base"
              >
                <span>Open Camera</span>
              </button>
            </div>
          )}

          {/* Step 2: Webcam with Close Icon */}
          {currentStep === 2 && showCamera && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Capture Business Card</h2>
                <button
                  onClick={stopCamera}
                  className="size-8 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      facingMode: facingMode,
                      frameRate: { ideal: 30 }
                    }}
                    className="w-full max-w-2xl mx-auto rounded-lg border-2 border-gray-300 shadow-lg aspect-video"
                    style={{
                      objectFit:'cover',
                      width: '100%',
                      height: '100%'
                    }}
                    onUserMedia={() => console.log('React-webcam: User media granted')}
                    onUserMediaError={(error) => {
                      console.error('React-webcam error:', error);
                      setError('Camera access denied. Please allow camera permissions.');
                    }}
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <span>Capture Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Captured Image with Details */}
          {currentStep === 3 && capturedImage && (
            <div>
              <div className="space-y-4">
                <div className="w-full max-w-2xl mx-auto flex justify-center">
                  <img
                    src={capturedImage}
                    alt="Captured business card"
                    className="max-w-full h-auto object-cover rounded-lg border-2 border-gray-300 shadow-lg aspect-video"
                  />
                </div>

                <div className="flex justify-center items-center gap-2 sm:gap-4">
                  <button
                    onClick={extractBusinessCard}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-white disabled:text-gray-600 disabled:border disabled:border-gray-200 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <span className="text-sm sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm sm:text-base">Extract</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetCapture}
                    className="w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span className="text-sm sm:text-base">Retake Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Data Section */}
        {extractedData && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-700">Extracted Business Information</h2>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {extractedData.company_name || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {extractedData.contact_person_name || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {extractedData.address || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {extractedData.website_url ? (
                    <a href={extractedData.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {extractedData.website_url}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {extractedData.email ? (
                    <a href={`mailto:${extractedData.email}`} className="text-blue-600 hover:underline">
                      {extractedData.email}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {extractedData.phone_number ? (
                    <a href={`tel:${extractedData.phone_number}`} className="text-blue-600 hover:underline">
                      {extractedData.phone_number}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={resetCapture}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Scan Another Card
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheet;
