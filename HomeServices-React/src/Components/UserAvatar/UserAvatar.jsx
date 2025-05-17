import { memo, useEffect, useState } from "react";
import "./user-avatar.css";
import { ListGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  setBalance,
  setUserToken,
  setUserTotalInfo,
} from "../../Store/homeServiceSlice";
import { Link, useNavigate } from "react-router-dom";
import { fetchFromAPI, postToAPI } from "../../api/FetchFromAPI";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
const UserAvatar = () => {
  const [showList, setShowList] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const history = useNavigate();
  const { userTotalInfo, userToken, balance } = useSelector(
    (state) => state.homeService
  );
  const handleWatchChange = async (storedUser) => {
    try {
      setIsLoading(true);
      const data = await fetchFromAPI(`api/user/${storedUser?.username}`);
      if (data !== storedUser) {
        dispatch(setUserTotalInfo(data));
        Cookies.set("userTotalInfo", JSON.stringify(data));
        setIsLoading(false);
      } else {
        dispatch(setUserTotalInfo(JSON.parse(storedUser)));
        setIsLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };
  if (userToken === null) {
    const storedToken = Cookies.get("userToken");
    storedToken && dispatch(setUserToken(storedToken));
  }
  balance === null && dispatch(setBalance(Cookies.get("balance")));
  const avatarList = [
    {
      label: userTotalInfo?.username,
      icon: <ion-icon name="person"></ion-icon>,
      link: `/user/${userTotalInfo?.username}`,
    },
    {
      label: "تعديل الحساب",
      icon: <ion-icon name="create-outline"></ion-icon>,
      link: `/user/${userTotalInfo?.username}/update_profile`,
    },
  ];
  const handleLogout = async () => {
    toast("يتم الآن تسجيل الخروج", {
      duration: 3000,
      position: "top-center",
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },
    });
    try {
      setIsSubmiting(true);
      let bearer = `token ${userToken}`;
      await postToAPI("api/logout/", null, {
        headers: {
          Authorization: bearer,
        },
      });
      Cookies.remove("userTotalInfo");
      Cookies.remove("userToken");
      Cookies.remove("balance");
      dispatch(setUserTotalInfo(null));
      dispatch(setUserToken(null));
      history("/");
      setIsSubmiting(false);
    } catch (err) {
      console.log(err);
      setIsSubmiting(false);
    }
  };
  window.addEventListener("click", (event) => {
    var userMenu = document.getElementById("user-menu");
    if (event.target !== userMenu) setShowList(false);
  });
  useEffect(() => {
    const storedUser = Cookies.get("userTotalInfo");
    storedUser && handleWatchChange(JSON.parse(storedUser));
  }, []);
  if (isLoading) {
    return <div className="userLoading"></div>;
  } else {
    return (
      <div className="user">
        <div className="image-holder">
          {userTotalInfo?.photo ? (
            <img
              id="user-menu"
              onClick={() => setShowList(!showList)}
              src={userTotalInfo?.photo}
            />
          ) : (
            <div className="image-skelton"></div>
          )}
        </div>
        <ListGroup className={showList ? "show" : null}>
          {avatarList.map((item, index) => (
            <ListGroup.Item key={index} action>
              <Link to={item.link}>
                {item.icon}
                <span className="w-max">{item.label}</span>
              </Link>
            </ListGroup.Item>
          ))}
          {userTotalInfo.mode === "seller" ? (
            <ListGroup.Item action>
              <ion-icon name="cash-outline"></ion-icon>
              <div className="d-flex gap-1 align-items-center">
                <span>{balance}</span>
                <span>نقطة</span>
              </div>
            </ListGroup.Item>
          ) : null}
          <ListGroup.Item
            className={`logout ${isSubmiting ? "loading" : null}`}
            action
            onClick={() => {
              !isSubmiting && handleLogout();
            }}
          >
            <ion-icon name="log-out-outline"></ion-icon>
            <span className="w-max">تسجيل الخروج</span>
          </ListGroup.Item>
        </ListGroup>
      </div>
    );
  }
};

export default memo(UserAvatar);
