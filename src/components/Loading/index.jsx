import './Loading.css';

export default function Loading({ hidden, ok, error, onRetry, onClick }) {
  return (
    <div className={['loading', hidden ? 'hidden' : ''].join(' ')}>
      <div className="loading-container">
        <img className="main-logo" src="./logo.svg" alt="Space Radio" />
        <span className="separate" />
        <span className="state-blok">
          <div id="spinner" className={ok ? 'hidden' : ''} />
          <button id="go" aria-label="Start radio" className={ok ? 'show' : ''} onClick={onClick}>
            <img src="./go.svg" alt="" />
          </button>
        </span>
        {error && <div className="loading-error" role="alert">{error} <button onClick={onRetry}>Retry</button></div>}
      </div>
    </div>
  );
}
