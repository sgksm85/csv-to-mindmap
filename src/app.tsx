import * as React from "react";
import { createRoot } from "react-dom/client";
import { useDropzone } from "react-dropzone";
import { parseCsv } from "./csv-utils";
import { parseMarkdown } from "./markdown-utils";
import { createMindmap } from "./mindmap";
import type { Miro } from "@mirohq/websdk-types";

declare global {
  interface Window {
    miro: Miro;
  }
}

const dropzoneStyles = {
  display: "flex",
  height: "100%",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "center",
  border: "3px dashed rgba(41, 128, 185, 0.5)",
  color: "rgba(41, 128, 185, 1.0)",
  fontWeight: "bold",
  fontSize: "1.2em",
} as const;

const App: React.FC = () => {
  const [files, setFiles] = React.useState<File[]>([]);
  const dropzone = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "text/markdown": [".md"],
    },
    maxFiles: 1,
    onDrop: (droppedFiles) => {
      setFiles([droppedFiles[0]]);
    },
  });

  const handleCreate = async () => {
    const failed = [];
    for (const file of files) {
      try {
        let contents;
        if (file.name.endsWith(".csv")) {
          contents = await parseCsv(file);
        } else if (file.name.endsWith(".md")) {
          const markdownText = await file.text();
          contents = await parseMarkdown(markdownText);
        }
        await createMindmap(contents);
      } catch (e) {
        failed.push(file);
        console.error('Error creating mindmap:', e);
      }
    }
    setFiles([]);
  };

  const style = React.useMemo(() => {
    let borderColor = "rgba(41, 128, 185, 0.5)";
    if (dropzone.isDragAccept) {
      borderColor = "rgba(41, 128, 185, 1.0)";
    }
    if (dropzone.isDragReject) {
      borderColor = "rgba(192, 57, 43,1.0)";
    }
    return {
      ...dropzoneStyles,
      borderColor,
    };
  }, [dropzone.isDragActive, dropzone.isDragReject]);

  return (
    <div className="dnd-container">
      <p>Select the CSV or Markdown file to import and create a mind map</p>
      <div {...dropzone.getRootProps({ style })}>
        <input {...dropzone.getInputProps()} />
        {dropzone.isDragAccept ? (
          <p className="dnd-text">Drop your file here</p>
        ) : (
          <>
            <div>
              <button
                type="button"
                className="button button-primary button-small"
              >
                Select file
              </button>
              <p className="dnd-text">Or drop your file here</p>
            </div>
          </>
        )}
      </div>
      {files.length > 0 && (
        <>
          <ul className="dropped-files">
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
          <button
            onClick={handleCreate}
            className="button button-small button-primary"
          >
            Create Mind Map
          </button>
        </>
      )}
    </div>
  );
};

// アプリケーションのマウント
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;
