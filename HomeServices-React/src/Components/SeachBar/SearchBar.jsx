import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setClearResults, setFlagToClose } from "../../Store/homeServiceSlice";
import { useDispatch } from "react-redux";
import "./searchbar.css";
import Cookies from "js-cookie";
const SearchBar = ({
  type,
  goto,
  setShow,
  animName = null,
  animDelay = null,
}) => {
  const [inputValue, setInputValue] = useState("");
  const history = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.length > 0) {
      handelSubmit();
      type !== "filled" && setShow(false);
    }
  };
  const handelSubmit = () => {
    if (goto === "page") {
      if (pathname.includes("/search")) {
        dispatch(setClearResults(true));
      } else {
        dispatch(setFlagToClose(true));
        history(`/search/${inputValue}`);
      }
    } else dispatch(setClearResults(true));
    Cookies.set("searchWord", inputValue, { expires: 2 });
  };
  return (
    <div
      data-aos={animName}
      data-aos-delay={animDelay}
      className={type === "filled" ? "filled-container" : "outlined-container"}
    >
      <input
        id={type === "filled" ? null : "input-search"}
        type="text"
        placeholder="ابحث عن"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e)}
      />
      <ion-icon
        onClick={() => {
          inputValue.length > 0 && handelSubmit();
          type !== "filled" && setShow(false);
        }}
        name="search-outline"
        className="search-icon"
      ></ion-icon>
    </div>
  );
};

export default SearchBar;
