// import closeIcon from "../../assets/icons/close-icon.svg";
import { useEffect, useState } from "react";
import { getLocalizedString } from "../../lib/i18n";
import { useBackend } from "../../lib";

const Panel = () => {
  const [content, setContent] = useState<string | undefined>(undefined);
  const backend = useBackend();
  const [screenshot, setScreenshot] = useState<string>('data:image/jpeg;base64,');

  const handleGetPageContent = () => {
    backend.getPageContent()
      .then((data) => {
        console.log(data);
        setContent(data);
        setScreenshot('data:image/jpeg;base64,');
      })
      .catch((error) => {
        console.error("Error fetching page content:", error);
      });
  }
  const handleGetPageScreenshots = () => {
    backend.getPageScreenshots()
      .then((data) => {
        if (data.length > 0) {
          setContent(data.length + ' screenshots received');
          setScreenshot('data:image/jpeg;base64, ' + data[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching page screenshots:", error);
      });
  }

  useEffect(() => {
    // handleGetPageContent()
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        // borderRadius: "10px 0 0 10px",
        border: "1px solid #7b7b7b",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #7b7b7b",
          color: "var(--text-color)",
          fontSize: "16px",
        }}
      >
        {getLocalizedString("aiwizeCombinerPanelTitle", "AI Wize Chat")}
        {/* <img src={closeIcon} alt="" width={16} height={16} /> */}
      </div>

      <div
        style={{
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          style={{
            maxWidth: "100px",
            padding: "8px 12px",
            margin: '0 auto',
          }}
          onClick={() => handleGetPageContent()}
        >
          Get content
        </button>
        <button
          style={{
            maxWidth: "100px",
            padding: "8px 12px",
            margin: '0 auto',
          }}
          onClick={() => handleGetPageScreenshots()}
        >
          Get screenshots
        </button>
        <img src={screenshot} alt="" style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
        <div
          style={{
            overflowY: 'auto',
            flexDirection: "column",
            display: "flex",
          }}
        >
          {content || 'No content available'}
        </div>

      </div>
    </div>
  );
};

export default Panel;
