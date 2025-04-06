import React from 'react';

interface PreviewProps {
  value: string;
}

export function Preview({ value }: PreviewProps) {
  return (
    <div className="w-full h-full overflow-auto">
      <iframe
        title="Email Preview"
        srcDoc={value}
        className="w-full h-full min-h-[400px] border-0"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
