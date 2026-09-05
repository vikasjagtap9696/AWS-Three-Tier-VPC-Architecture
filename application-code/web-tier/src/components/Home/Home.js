import React, { Component } from 'react';
import architecture from '../../assets/3TierArch.png';
import DatabaseDemo from '../DatabaseDemo/DatabaseDemo';
import './Home.css';

class Home extends Component {
  render() {
    return (
      <main className="single-page-app">
        <section className="app-welcome">
          <div className="welcome-copy">
            <span className="app-logo-mark">R</span>
            <p className="welcome-kicker">REYAZ THREE-TIER APPLICATION</p>
            <h1>Student Management</h1>
            <p className="welcome-text">Manage student records from one simple, connected workspace.</p>
            <div className="welcome-actions"><span className="welcome-pill">AWS powered</span><span className="welcome-pill">Database connected</span></div>
          </div>
          <div className="architecture-frame"><img src={architecture} alt="Reyaz three-tier application architecture" /></div>
        </section>
        <section className="crud-section"><DatabaseDemo /></section>
      </main>
    );
  }
}

export default Home;
