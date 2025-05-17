import { Fragment } from "react";
import UserProfileCard from "./UserProfileCard/UserProfileCard";

const UserProfileLayout = ({ children }) => {
  return (
    <Fragment>
      <UserProfileCard />
      {children}
    </Fragment>
  );
};

export default UserProfileLayout;
