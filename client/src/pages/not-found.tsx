import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
      <Card className="w-full max-w-md mx-4 border-slate-700 bg-slate-800 text-slate-200 shadow-xl">
        <CardContent className="pt-6">
          <div className="border-l-2 border-red-500 pl-4 mb-6">
            <h1 className="text-2xl font-mono font-bold text-slate-200">Error 404</h1>
            <p className="text-slate-400 text-sm font-mono">Page not found</p>
          </div>

          <div className="rounded-md bg-slate-900 p-4 font-mono text-sm mb-6 border border-slate-700">
            <p className="text-red-400">Uncaught ReferenceError:</p>
            <p className="text-slate-300 mt-1">{">"} <span className="text-yellow-300">route</span> is not defined at <span className="text-blue-300">AppRouter</span></p>
            <p className="text-slate-400 mt-3 text-xs">at /src/routes.tsx:42:10</p>
          </div>

          <p className="mt-4 text-sm text-slate-400 mb-4">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex space-x-3">
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              <Link to="/">
                Return Home
              </Link>
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Check Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
