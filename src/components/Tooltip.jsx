import { useState } from 'react';

export default function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid var(--primary)',
          color: 'var(--text-main)',
          fontSize: '12px',
          borderRadius: '6px',
          width: 'max-content',
          maxWidth: '280px',
          whiteSpace: 'normal',
          lineHeight: '1.4',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          textAlign: 'center'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: 'var(--primary) transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
}
