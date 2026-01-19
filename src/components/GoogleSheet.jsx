import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GoogleSheet = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const webcamRef = useRef(null);

  const startCamera = () => {
    setError('');
    setCameraLoading(true);
    setShowCamera(true);
    setCameraLoading(false);
  };

  const stopCamera = () => {
    setShowCamera(false);
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080,
        quality: 0.95
      });
      
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setShowCamera(false);
        setExtractedData(null);
        setError('');
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Business Card Scanner</h1>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Camera Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Capture Business Card</h2>
          
          {!capturedImage ? (
            <div className="space-y-4">
              {cameraLoading ? (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-4xl animate-spin">📷</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Starting Camera...</h3>
                  <p className="text-gray-600">Please allow camera permissions when prompted</p>
                </div>
              ) : showCamera ? (
                <div className="space-y-4">
                  {/* Camera Info Display */}
                  <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex justify-center space-x-6 text-gray-600">
                      <span>📹 1920×1080</span>
                      <span>🎬 30fps</span>
                      <span>📱 {facingMode === 'environment' ? 'Rear' : 'Front'} Camera</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    {/* React-Webcam Component */}
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
                      className="w-full max-w-2xl mx-auto rounded-lg border-2 border-gray-300 shadow-lg"
                      style={{ 
                        transform: 'scaleX(1)',
                        objectFit: 'cover',
                        minHeight: '400px'
                      }}
                      onUserMedia={() => console.log('React-webcam: User media granted')}
                      onUserMediaError={(error) => {
                        console.error('React-webcam error:', error);
                        setError('Camera access denied. Please allow camera permissions.');
                      }}
                    />
                    
                    {/* Camera Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-lg m-2 opacity-50"></div>
                      <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span>📷 React-Webcam Live</span>
                      </div>
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs font-medium">
                        HD Quality
                      </div>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
                        🎯 Position business card within frame
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={capturePhoto}
                      className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <span>📸</span>
                      <span>Capture Photo</span>
                    </button>
                    <button
                      onClick={switchCamera}
                      className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <span>🔄</span>
                      <span>Switch Camera</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-8 py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                    >
                      <span>❌</span>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-4xl">📷</span>
                    </div>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
                  >
                    <span>🎥</span>
                    <span>Open Camera</span>
                  </button>
                  <p className="mt-4 text-gray-600">Click to start camera and capture business card</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Captured Photo Preview */}
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured business card"
                  className="w-full max-w-2xl mx-auto rounded-lg border-2 border-green-400 shadow-lg"
                />
                {/* Photo Preview Overlay */}
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✅ Photo Captured
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                  Review your captured photo
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={extractBusinessCard}
                  disabled={isProcessing}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <span>⏳</span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Extract Business Info</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetCapture}
                  className="px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Retake Photo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Data Section */}
        {extractedData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Extracted Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
