import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
// import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx(styles.heroBanner)}>
      <div className="container">

        <img src="/img/OSH-Logo-NoText.png" style={{width: 100}}/>
        <Heading as="h1" className="osh-title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
      
        <div className="row">
          {/* <Link to={"/docs/osh-node/introduction"} className="oshnode-btn">OSH Node</Link>

          <Link to={"/docs/osh-connect/getting-started"} className="oshconnect-btn-dark">OSH Connect
        </Link> */}
       
         
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        
      </main>
    </Layout>
  );
}
