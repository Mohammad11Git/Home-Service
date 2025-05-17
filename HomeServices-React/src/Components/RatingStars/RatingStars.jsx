import { useState } from "react";
import "./rating-stars.css";
const RatingStars = ({ setValue }) => {
  const [activeStars, setActiveStars] = useState(0);
  const handleStarClicked = (index) => {
    setActiveStars(index + 1);
  };
  let stars = [];
  for (let i = 0; i < 5; ++i) {
    const isActive = i < activeStars;
    stars.push(
      <div
        className={isActive ? "active" : ""}
        onClick={() => {
          handleStarClicked(i);
          setValue(i + 1);
        }}
      >
        <ion-icon name="star"></ion-icon>
      </div>
    );
  }
  return <div className="rating-stars">{stars}</div>;
};

export default RatingStars;
