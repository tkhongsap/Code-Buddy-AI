import { Button } from "@/components/ui/button";
import Header from "../layout/Header";

interface OptimizationHeaderProps {
  toggleStreaming: () => void;
  useStreaming: boolean;
}

export default function OptimizationHeader({ toggleStreaming, useStreaming }: OptimizationHeaderProps) {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex justify-end px-4 py-2 border-b">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleStreaming}
          className="text-xs"
        >
          {useStreaming ? "Disable Streaming" : "Enable Streaming"}
        </Button>
      </div>
    </div>
  );
}