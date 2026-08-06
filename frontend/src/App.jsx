import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, UploadCloud, CheckCircle, AlertCircle, Trash2, Layers } from 'lucide-react';
import axios from 'axios';

export default function App() {
  const [file, setFile] = useState(null);
  const [preference, setPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFuzzy, setIsFuzzy] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file || !preference) {
      setError('Please provide both a file and a preference.');
      return;
    }
    
    setError(null);
    setLoading(true);
    setResults(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userPreference', preference);
    formData.append('isFuzzy', isFuzzy);
    
    try {
      const response = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[#f5f5f7] p-4 md:p-8 font-sans selection:bg-[#0A84FF] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="text-center pt-8 pb-4 space-y-5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-4 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl mb-2"
          >
            <Layers className="w-10 h-10 text-[#0A84FF]" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70"
          >
            Intelligence, ranked.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#86868b] max-w-2xl mx-auto font-medium"
          >
            Upload your dataset and describe your ideal outcome. Our neural engine handles the complex TOPSIS mathematics instantly.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Input Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col space-y-6"
          >
            {/* Glass Card */}
            <div className="bg-[#1c1c1e]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 shadow-2xl flex-1 flex flex-col space-y-8">
              
              {/* File Upload */}
              <div className="space-y-3">
                <label className="block text-[15px] font-semibold text-[#f5f5f7]">1. Dataset</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="relative group rounded-3xl border border-dashed border-white/20 p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all cursor-pointer bg-white/[0.02]"
                >
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center space-y-3 text-[#0A84FF]">
                      <CheckCircle className="w-12 h-12" />
                      <span className="font-semibold text-lg">{file.name}</span>
                      <span className="text-sm text-[#86868b]">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className="w-8 h-8 text-[#86868b] group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-[#f5f5f7] font-medium text-lg">Choose a file or drag it here.</p>
                        <p className="text-[13px] text-[#86868b] mt-1 font-medium">CSV, XLSX, or JSON.</p>
                      </div>
                    </div>
                  )}
                </div>
                {file && (
                   <div className="flex justify-center">
                     <button 
                       onClick={() => setFile(null)}
                       className="mt-2 text-sm text-[#ff453a] hover:text-[#ff6961] flex items-center space-x-1.5 transition-colors font-medium px-4 py-1.5 rounded-full hover:bg-[#ff453a]/10"
                     >
                       <Trash2 className="w-4 h-4" /> <span>Remove File</span>
                     </button>
                   </div>
                )}
              </div>

              {/* Preference Input */}
              <div className="space-y-3">
                <label className="block text-[15px] font-semibold text-[#f5f5f7]">2. Parameters</label>
                <textarea 
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  placeholder="e.g. 'I want the highest performance with the lowest possible price...'"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-[15px] text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] transition-all resize-none h-32 leading-relaxed"
                />
              </div>

              {/* Fuzzy Mode Toggle */}
              <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-5">
                <div>
                  <h4 className="text-[15px] font-semibold text-[#f5f5f7]">Fuzzy Logic Engine</h4>
                  <p className="text-[13px] text-[#86868b] mt-1 leading-relaxed max-w-[280px]">Enable for datasets using linguistic variables (e.g. "Good", "Poor") instead of precise numeric values.</p>
                </div>
                <button 
                  onClick={() => setIsFuzzy(!isFuzzy)}
                  className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isFuzzy ? 'bg-[#34c759]' : 'bg-white/10'}`}
                >
                  <span className={`pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isFuzzy ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/20 text-[#ff453a] flex items-start space-x-3 text-[14px] font-medium">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze Button */}
              <button 
                onClick={handleAnalyze}
                disabled={loading || !file || !preference}
                className="w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0A84FF] hover:bg-[#007aff] text-white shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_25px_rgba(10,132,255,0.5)] mt-auto"
              >
                {loading ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" />
                    <span>Processing Matrix...</span>
                  </>
                ) : (
                  <span>Rank Alternatives</span>
                )}
              </button>

            </div>
          </motion.section>

          {/* Results Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col h-full min-h-[600px]"
          >
            {loading ? (
              <div className="flex-1 bg-[#1c1c1e]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 flex flex-col items-center justify-center space-y-6 shadow-2xl">
                 <div className="relative">
                   <div className="w-16 h-16 border-4 border-white/10 rounded-full"></div>
                   <div className="w-16 h-16 border-4 border-[#0A84FF] rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                 </div>
                 <div className="text-center space-y-2">
                   <h3 className="text-xl font-semibold text-[#f5f5f7]">Neural Engine Active</h3>
                   <p className="text-[#86868b] font-medium text-[15px]">Extracting context and processing TOPSIS matrix.</p>
                 </div>
              </div>
            ) : results ? (
              <div className="bg-[#1c1c1e]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl flex flex-col h-full max-h-[850px] overflow-hidden">
                <div className="p-8 pb-6 border-b border-white/10 bg-white/[0.02]">
                  <h2 className="text-3xl font-semibold text-[#f5f5f7] tracking-tight">Results</h2>
                  <p className="text-[#86868b] text-[15px] mt-1 font-medium">Ranked dynamically by your AI preferences.</p>
                </div>
                
                {/* Weights & Impacts Summary */}
                <div className="px-8 py-4 border-b border-white/10 bg-black/20 flex flex-wrap gap-2.5">
                  {results.weights.map((w, i) => (
                     <div key={i} className="px-3 py-1.5 rounded-full bg-white/5 text-[13px] font-medium border border-white/10 flex items-center space-x-2 backdrop-blur-md shadow-sm">
                       <span className="text-[#86868b]">W:</span>
                       <span className="text-[#f5f5f7]">{w.toFixed(2)}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${results.impacts[i] === '+' ? 'bg-[#32d74b]/15 text-[#32d74b]' : 'bg-[#ff453a]/15 text-[#ff453a]'}`}>
                         {results.impacts[i] === '+' ? 'MAX' : 'MIN'}
                       </span>
                     </div>
                  ))}
                </div>

                {/* Ranking List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-white/[0.01]">
                  {results.results.map((item, index) => (
                    <motion.div 
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                      className={`relative overflow-hidden flex items-center p-5 rounded-2xl border backdrop-blur-md transition-transform hover:scale-[1.01] ${index === 0 ? 'border-[#0A84FF]/50 bg-[#0A84FF]/10 shadow-[0_4_20px_rgba(10,132,255,0.15)]' : 'border-white/10 bg-white/5'}`}
                    >
                      
                      <div className="flex-1 flex items-center space-x-5">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg shadow-inner ${index === 0 ? 'bg-gradient-to-br from-[#0A84FF] to-[#007aff] text-white' : 'bg-white/10 text-[#86868b]'}`}>
                          #{item.rank}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xl font-semibold tracking-tight ${index === 0 ? 'text-white' : 'text-[#f5f5f7]'}`}>{item.name}</h4>
                          <div className="flex items-center mt-1 space-x-2">
                             <div className="h-1.5 rounded-full bg-white/10 flex-1 overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(10, item.score * 100)}%` }}
                                  transition={{ delay: 0.5 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                                  className={`h-full rounded-full ${index === 0 ? 'bg-[#0A84FF]' : 'bg-white/40'}`} 
                                />
                             </div>
                             <p className="text-[13px] font-medium text-[#86868b] w-12 text-right">{(item.score).toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                      
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-[#1c1c1e]/60 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-5 border-dashed shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center shadow-inner">
                  <Activity className="w-10 h-10 text-[#86868b]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#f5f5f7]">Awaiting Data</h3>
                  <p className="text-[#86868b] text-[15px] font-medium max-w-sm mt-3 leading-relaxed">Upload a matrix and provide a parameter description to generate rankings.</p>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
