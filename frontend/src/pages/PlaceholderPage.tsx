import React from 'react';

type PlaceholderPageProps = {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {

    return (
        <div style={{padding: '2rem', color: 'black'}}>
            <h1>{title}</h1>
            <p>Em construção...</p>
        </div>
    );
}

export default PlaceholderPage;