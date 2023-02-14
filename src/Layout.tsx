import React from 'react';

export interface LayoutProps {
  title: string;
  style?: any;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({title, style, children}) => {
  return (
    <div className="k-line-chart-container" style={style}>
      <h3 className="k-line-chart-title">
        {title} &nbsp;
        <img src="https://media.giphy.com/media/WUlplcMpOCEmTGBtBW/giphy.gif" width="30" alt="" />
      </h3>
      {children}
    </div>
  );
};

export default Layout;
