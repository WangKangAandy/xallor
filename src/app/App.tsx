import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { DesktopGrid } from './components/DesktopGrid';

export default function App() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5ueSUyMGJlYWNoJTIwaXNsYW5kJTIwY2xlYXIlMjBza3l8ZW58MHx8fHwxNjk2NTQ3OTM3fDA&ixlib=rb-4.1.0&q=80&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/10 via-blue-50/10 to-blue-200/20 backdrop-blur-[1px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center pt-[15vh] px-8 md:px-16 xl:px-24 w-full h-screen overflow-y-auto pb-32">
        <div className="w-full flex flex-col items-center transition-all duration-700 xl:scale-[1.02] 2xl:scale-[1.05] xl:origin-top flex-1">
          {/* Search Bar */}
          <div className="w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] mb-12 flex justify-center flex-shrink-0 transition-all duration-500">
            <SearchBar />
          </div>

          {/* Unified Desktop Grid */}
          <div className="w-full flex-1 flex justify-center max-w-[1200px] xl:max-w-[1280px] transition-all duration-500">
            <DesktopGrid />
          </div>
        </div>
      </div>
    </div>
  );
}