import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { fetchFromAPI } from "../api/FetchFromAPI";
import { setAreasList } from "../Store/homeServiceSlice";
import { json } from "react-router-dom";
import Cookies from "js-cookie";

const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#f7f9fc",
    color: "black",
    borderRadius: "5px",
    border: "none",
    boxShadow: "none",
    width: "200px",
    height: "40px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#0f3460" : "#f7f9fc",
    color: state.isSelected ? "#f7f9fc" : "#0f3460",
    "&:hover": {
      backgroundColor: "#0f3460",
      color: "#f7f9fc",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "black",
  }),
};

const AreaSelect = ({ areaSelected, setAreaSelected }) => {
  const { areasList } = useSelector((state) => state.homeService);
  const dispatch = useDispatch();
  if (!areasList) {
    const storedAreas = Cookies.get("areasList");
    if (!storedAreas) {
      fetchFromAPI("api/register/").then((res) => {
        dispatch(setAreasList(res));
        Cookies.set("areasList", JSON.stringify(res), { expires: 10 });
      });
    } else dispatch(setAreasList(JSON.parse(storedAreas)));
  }
  const handleChange = (selectedOption) => {
    setAreaSelected(selectedOption.value);
  };
  let options = [];
  options = areasList?.map((area) => {
    return { value: area.id, label: area.name };
  });
  return (
    <Select
      options={options}
      placeholder="اختر المدينة"
      defaultValue={
        areaSelected === null
          ? null
          : { value: areaSelected, label: areaSelected }
      }
      styles={customStyles}
      onChange={handleChange}
    />
  );
};

export default AreaSelect;
