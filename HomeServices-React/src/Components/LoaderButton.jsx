import { Spinner } from "react-bootstrap";

const LoaderButton = ({ isSubmitting, color }) => {
  return (
    <button
      className={`${color} disable`}
      disabled={isSubmitting}
      hidden={!isSubmitting}
    >
      <Spinner as="span" animation="border" role="status" aria-hidden="true" />
    </button>
  );
};

export default LoaderButton;
