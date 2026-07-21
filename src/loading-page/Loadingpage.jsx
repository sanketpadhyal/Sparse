import "./Loadingpage.css";

function LoadingScreen() {

  return (

    <div className="loading-screen">

      <div className="loading-center">

        <div className="loader-mark">
          <img
            src="/assets/logo.png"
            className="loading-logo"
            alt="Sparse" />
          
        </div>

      </div>

      <div className="loading-caption">
        <span className="loading-caption-top">from</span>
        <span className="loading-caption-brand">Sparse Limited</span>
      </div>

    </div>);



}

export default LoadingScreen;