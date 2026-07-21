import { useEffect } from "react";
import "./Alert.css";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";




function Alert({ message, type, onClose }) {

  useEffect(() => {

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);

  }, [onClose]);

  const getIcon = () => {

    if (type === "success") {
      return <FaCheckCircle className="alert-icon success" />;
    }

    if (type === "error") {
      return <FaTimesCircle className="alert-icon error" />;
    }

    return <FaInfoCircle className="alert-icon info" />;

  };

  return (

    <div className="alert-overlay">

<div className={`alert-box ${type}`}>

<div className="alert-left">
<div className="alert-icon-wrapper">
{getIcon()}
</div>

<div className="alert-text">
<span className="alert-title">
{type === "success" ? "Success" : type === "error" ? "Error" : "Notice"}
</span>

<span className="alert-message">
{message}
</span>
</div>
</div>

<button
          className="alert-close"
          onClick={onClose}>
          
×
</button>

<div className="alert-progress"></div>

</div>

</div>);



}

export default Alert;