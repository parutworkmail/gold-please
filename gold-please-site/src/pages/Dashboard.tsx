import React from 'react';
import Header from '../components/Header';
import GoldGraph from '../components/GoldGraph';

const Dashboard: React.FC = () => {
  return (
    <div>
      <Header />
      <main style={{ padding: '1rem' }}>
        <GoldGraph />
        {/* Add more components here for additional features */}
      </main>
    </div>
  );
};

export default Dashboard;