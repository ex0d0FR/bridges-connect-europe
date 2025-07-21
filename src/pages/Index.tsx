
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    console.log("Index component mounted successfully");
    console.log("Current URL:", window.location.href);
    console.log("Document body classes:", document.body.className);
    console.log("Computed styles for body:", window.getComputedStyle(document.body));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-500">
      {/* Debug element with inline styles to ensure visibility */}
      <div style={{ 
        backgroundColor: 'blue', 
        color: 'white', 
        padding: '20px', 
        border: '2px solid yellow',
        fontSize: '24px',
        textAlign: 'center'
      }}>
        DEBUG: This should be visible with inline styles
      </div>
      
      {/* Original content with high contrast colors */}
      <div className="text-center bg-yellow-300 p-8 border-4 border-black">
        <h1 className="text-4xl font-bold mb-4 text-black">Welcome to Your Blank App</h1>
        <p className="text-xl text-black">Start building your amazing project here!</p>
        
        {/* Additional debug info */}
        <div className="mt-4 text-sm text-gray-800">
          <p>Tailwind classes test:</p>
          <div className="bg-green-500 text-white p-2 m-2">Green background</div>
          <div className="bg-blue-500 text-white p-2 m-2">Blue background</div>
          <div className="bg-purple-500 text-white p-2 m-2">Purple background</div>
        </div>
      </div>
    </div>
  );
};

export default Index;
