import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import TripForm from './TripForm';

const TripEditModal = ({ isOpen, onClose, ...formProps }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return ReactDOM.createPortal(
        <div className={`modal-overlay-premium ${isOpen ? 'active' : ''}`} onClick={onClose}>
            <div className={`modal-content-premium ${isOpen ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
                <button
                    className="modal-close-btn"
                    onClick={onClose}
                    type="button"
                >
                    <X size={20} />
                </button>

                <div className="no-scrollbar" style={{ height: 'calc(90vh - 40px)', maxHeight: '90vh', overflowY: 'scroll', paddingRight: '4px' }}>
                    <TripForm {...formProps} onCancelEdit={onClose} />
                </div>
            </div>

            <style jsx>{`
                .modal-overlay-premium {
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100vw; 
                    height: 100vh;
                    background: rgba(0, 0, 0, 0); 
                    backdrop-filter: blur(0px);
                    z-index: 99999; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                }
                .modal-overlay-premium.active {
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    pointer-events: auto;
                }
                
                .modal-content-premium {
                    width: 90vw; 
                    max-width: 800px;
                    position: relative;
                    transform: scale(0.95) translateY(20px);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .modal-content-premium.active {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }

                .modal-close-btn {
                    position: absolute;
                    top: -45px;
                    right: 0;
                    background: var(--glass-border);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .modal-close-btn:hover {
                    background: #ef4444;
                    border-color: #ef4444;
                    transform: rotate(90deg);
                }

                /* Mobile Optimization */
                @media (max-width: 600px) {
                    .modal-overlay-premium { 
                        padding: 1rem; 
                        /* Force center even on mobile */
                        align-items: center !important; 
                    }
                    .modal-content-premium { 
                        margin-bottom: 0; 
                        max-width: 100%;
                    }
                    /* Ensure content scrolls if too tall */
                    .modal-content-premium > div {
                        max-height: 90vh !important;
                    }
                    .modal-content-premium > div {
                        height: 80vh !important;
                    }
                }

                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default TripEditModal;
