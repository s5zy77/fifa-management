import React, { useState } from 'react';
import { uploadDataset } from '../utils/api';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export const UploadDataset = ({ onUploadSuccess }) => {
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('uploading');
    try {
      await uploadDataset(file);
      setStatus('success');
      setErrorMsg('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
    // Reset file input
    e.target.value = null;
  };

  return (
    <div className="bg-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-700 w-full">
      <h3 className="text-lg font-display mb-2 flex items-center gap-2 text-slate-100">
        <UploadCloud className="w-5 h-5 text-calm-teal" /> 
        Dataset Evaluator Upload
      </h3>
      <p className="text-sm text-slate-400 mb-4 font-body">Upload a JSON dataset to simulate varying stadium conditions dynamically.</p>
      
      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors focus-within:ring-2 focus-within:ring-calm-teal">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="mb-2 text-sm text-slate-400">
            <span className="font-semibold text-slate-200">Click to upload JSON</span>
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".json" 
          onChange={handleFileChange}
          data-testid="file-upload"
        />
      </label>

      {status === 'uploading' && (
        <div className="mt-4 text-sm text-calm-amber flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-calm-amber"></span> Uploading...
        </div>
      )}
      
      {status === 'success' && (
        <div className="mt-4 text-sm text-calm-teal flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Successfully applied to live environment.
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 text-sm text-calm-red bg-calm-red/10 p-3 rounded-lg border border-calm-red/20 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" /> 
          <span className="break-words font-medium" data-testid="upload-error">{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
