import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface NeutralArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  level?: 'easy' | 'normal' | 'expert';
  originalUrl?: string;
}

const NeutralArticleModal: React.FC<NeutralArticleModalProps> = ({ isOpen, onClose, title, content, level = 'normal', originalUrl }) => {
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title}\n\n${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: content,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy();
      alert('공유 기능을 지원하지 않아 내용을 클립보드에 복사했습니다.');
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    setSaveStatus('saving');
    try {
      const articlesRef = collection(db, 'users', user.uid, 'saved_neutral_articles');
      await addDoc(articlesRef, {
        userId: user.uid,
        title,
        content,
        level,
        savedAt: new Date().toISOString(),
        originalUrl: originalUrl || ''
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/saved_neutral_articles`);
    } finally {
      setSaveStatus('idle');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-20 z-[301] bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-widest truncate">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-950 p-6 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
              {content}
            </div>
            <div className="flex gap-4 mt-6 justify-end">
              <button 
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
                  saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장 완료' : '마이페이지 저장'}
              </button>
              <button 
                onClick={handleCopy}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase rounded-xl transition-all"
              >
                {copied ? '복사 완료!' : '내용 복사'}
              </button>
              <button 
                onClick={handleShare}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl transition-all"
              >
                공유하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NeutralArticleModal;
