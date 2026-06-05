import React from 'react';

export const Component = ({ children }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
          backgroundImage: 'url(/morgan_shadow_report.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {children && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Component;
