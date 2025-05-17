import Select from "react-select";

const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#f7f9fc",
    color: "black",
    borderRadius: "5px",
    border: "none",
    boxShadow: "none",
    width: "130px",
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

const TypeSelect = ({ type, value, setFormDataList, id }) => {
  const handleChange = (selectedOption) => {
    setFormDataList((prevList) => {
      return prevList.map((item) => {
        if (item.id === id) {
          return { ...item, field_type: selectedOption.value };
        }
        return item;
      });
    });
  };
  let options = [
    { value: "text", label: "نص" },
    { value: "number", label: "رقم" },
  ];
  let defaultValue;
  if (value === "text") {
    defaultValue = { value: "text", label: "نص" };
  } else if (value === "number") {
    defaultValue = { value: "number", label: "رقم" };
  } else {
    defaultValue = null;
  }

  if (type === "read") {
    return (
      <Select styles={customStyles} value={defaultValue} isDisabled={true} />
    );
  } else {
    return (
      <Select
        value={defaultValue}
        options={options}
        placeholder="نوع الاجابة"
        styles={customStyles}
        onChange={handleChange}
      />
    );
  }
};

export default TypeSelect;
