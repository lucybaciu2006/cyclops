import { Button } from "@/components/ui/button";
import { MicIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <MicIcon className="w-12 h-12 text-primary"/>
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r text-grey-600 bg-clip-text">
          Asistentul Vocal pentru Apartamentul Tău
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">
          Automatizează comunicarea cu oaspeții tăi și oferă-le o experiență premium, 24/7
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
              className="px-8 py-6 text-lg"
              onClick={() => navigate("/start")}
          >
            Începe acum
          </Button>
          <Button
              variant="outline"
              className="px-8 py-6 text-lg"
              onClick={() => navigate("/learn-more")}
          >
            Află mai multe
          </Button>
        </div>
      </div>
    </div>
  );
};
