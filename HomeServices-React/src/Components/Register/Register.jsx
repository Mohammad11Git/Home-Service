import { ErrorMessage, Formik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import "./regsiter.css";
import { Container, Form } from "react-bootstrap";
import DatePicker from "react-date-picker";
import { format } from "date-fns";
import { postToAPI } from "../../api/FetchFromAPI";
import AreaSelect from "../AreaSelect";
import { Toaster, toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  setIsRegistered,
  setUserInputValue,
} from "../../Store/homeServiceSlice";
import LoaderButton from "../LoaderButton";
import LogoBlack from "../../Images/logo-black.png";
import Cookies from "js-cookie";

const SignInSchema = Yup.object().shape({
  first_name: Yup.string()
    .required("لم تدخل اسمك بعد")
    .min(3, "الاسم الذي أدخلته قصير جداً. 3 أحرف هو الحد الأدنى")
    .max(15, "الاسم الذي أدخلته كبير جداً. 15 أحرف هو الحد الأقصى"),
  last_name: Yup.string()
    .required("لم تدخل اسم العائلة بعد")
    .min(3, "اسم العائلة الذي أدخلته قصير جداً. 3 أحرف هو الحد الأدنى")
    .max(15, "اسم العائلة الذي أدخلته كبير جداً. 15 أحرف هو الحد الأقصى"),
  email: Yup.string()
    .email("أدخل بريد الكتروني صالح")
    .required("لم تدخل بريدك الالكتروني بعد"),
  password: Yup.string()
    .required("لم تدخل كلمة مرور بعد")
    .min(8, "كلمة السر التي أدخلتها قصيرة جداً. 8 أحرف هو الحد الأدنى")
    .matches(
      /^[A-Za-z\d@$!%*#?&]{8,60}$/,
      " كلمة السر يجب أن تحتوي على 8 إلى 60 محرف بالانكليزية"
    ),
  password2: Yup.string()
    .oneOf([Yup.ref("password"), null], "كلمة السر غير مطابقة")
    .required("لم تدخل تأكيد كلمة السر"),
});

const Register = () => {
  const dispatch = useDispatch();
  const history = useNavigate();
  const [page, setPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(0);
  const [dateValue, setDateValue] = useState(new Date());
  const [mode, setMode] = useState(null);
  const [gender, setGender] = useState(null);
  const [areaSelected, setAreaSelected] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isPasswordVisible2, setPasswordVisible2] = useState(false);
  const initialValues = {
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
    area: null,
  };
  const submitHandler = (values) => {
    let username = values.email.substring(0, values.email.indexOf("@"));
    const userInfo = {
      ...values,
      username: username,
      birth_date: format(dateValue, "yyyy-MM-dd"),
      gender: gender,
      mode: mode,
      area: areaSelected,
    };
    setIsSubmitting(1);
    postToAPI("api/register/", userInfo)
      .then((res) => {
        setIsSubmitting(0);
        dispatch(setIsRegistered(true));
        dispatch(
          setUserInputValue({ email: values.email, password: values.password })
        );
        Cookies.set(
          "userInputValue",
          JSON.stringify({ email: values.email, password: values.password }),
          {
            expires: 1,
          }
        );
        history("/confirm_email");
      })
      .catch((err) => {
        console.log(err);
        if (err.response.data.email?.length > 0) {
          toast.error("البريد الالكتروني مدخل سابقا", {
            duration: 3000,
            position: "top-center",
            ariaProps: {
              role: "status",
              "aria-live": "polite",
            },
          });
        } else if (err.response.data.mode?.length > 0) {
          toast.error("الرجاءاختيار انت بائع أم مستخدم", {
            duration: 3000,
            position: "top-center",
            ariaProps: {
              role: "status",
              "aria-live": "polite",
            },
          });
        } else if (err.response.data.gender?.length > 0) {
          toast.error("الرجاءاختيار جنسك", {
            duration: 3000,
            position: "top-center",
            ariaProps: {
              role: "status",
              "aria-live": "polite",
            },
          });
        } else if (err.response.data.area?.length > 0) {
          toast.error("الرجاءاختيار مدينتك", {
            duration: 3000,
            position: "top-center",
            ariaProps: {
              role: "status",
              "aria-live": "polite",
            },
          });
        }
        setIsSubmitting(0);
      });
  };
  return (
    <section className="d-flex justify-content-center align-items-center">
      <Toaster />
      <Formik initialValues={initialValues} validationSchema={SignInSchema}>
        {({ values, isValid, handleChange, handleBlur, errors, touched }) => (
          <Container className="d-flex justify-content-center align-items-center">
            <form
              onSubmit={(e) => e.preventDefault()}
              data-aos="fade-up"
              className={`register-1 ${page === 1 ? "hidden" : ""}`}
            >
              <div className="logo">
                <img src={LogoBlack} alt="" />
              </div>
              <h2>انشاء حساب</h2>
              <div className="full-name d-flex gap-3">
                <div className="first-name">
                  <label>
                    الاسم
                    <span>*</span>
                  </label>
                  <input
                    className={`${
                      touched.first_name && errors.first_name ? "error " : null
                    }`}
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="أدخل اسمك باللغةالعربية"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.first_name}
                  />
                  <p>
                    <ErrorMessage name="first_name" />
                  </p>
                </div>
                <div className="last-name">
                  <label>
                    اسم العائلة
                    <span>*</span>
                  </label>
                  <input
                    className={`${
                      touched.last_name && errors.last_name ? "error " : null
                    }`}
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="أدخل اسم العائلة باللغةالعربية"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.last_name}
                  />
                  <p>
                    <ErrorMessage name="last_name" />
                  </p>
                </div>
              </div>
              <div className="email">
                <label>
                  البريد الالكتروني
                  <span>*</span>
                </label>
                <input
                  className={`${
                    touched.email && errors.email ? "error " : null
                  }`}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="أدخل البريد الالكتروني الخاص بك"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                />
                <p>
                  <ErrorMessage name="email" />
                </p>
              </div>
              <div className="password">
                <label>
                  كلمة المرور
                  <span>*</span>
                </label>

                {/* Password with toggle show/hidden */}
                <div className="position-relative mb-1">
                  <input
                    className={`${
                      touched.password && errors.password ? "error" : null
                    }`}
                    id="password"
                    name="password"
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الخاصة بك"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                  />
                  <button
                    className="eye"
                    type="button"
                    onClick={() => setPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <ion-icon name="eye-outline"></ion-icon>
                    ) : (
                      <ion-icon name="eye-off-outline"></ion-icon>
                    )}
                  </button>
                </div>
                <p>
                  <ErrorMessage name="password" />
                </p>
              </div>
              <div className="password2">
                <label>
                  أكد كلمة المرور
                  <span>*</span>
                </label>

                {/* Password with toggle show/hidden */}
                <div className="position-relative mb-1">
                  <input
                    className={`${
                      touched.password2 && errors.password2 ? "error" : null
                    }`}
                    id="password2"
                    name="password2"
                    type={isPasswordVisible2 ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الخاصة بك"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password2}
                  />
                  <button
                    className="eye"
                    type="button"
                    onClick={() => setPasswordVisible2(!isPasswordVisible2)}
                  >
                    {isPasswordVisible2 ? (
                      <ion-icon name="eye-outline"></ion-icon>
                    ) : (
                      <ion-icon name="eye-off-outline"></ion-icon>
                    )}
                  </button>
                </div>
                <p>
                  <ErrorMessage name="password2" />
                </p>
              </div>
              <div
                className={
                  !isValid ||
                  (!touched.email && !touched.password && !touched.password2)
                    ? "next disable"
                    : "next"
                }
                onClick={() => {
                  !isValid ||
                  (!touched.email && !touched.password && !touched.password2)
                    ? setPage(0)
                    : setPage(1);
                }}
              >
                التالي
              </div>
            </form>
            <form
              onSubmit={(e) => e.preventDefault()}
              className={`register-2 ${page === 0 ? "hidden" : ""}`}
            >
              <div className="logo">
                <img src={LogoBlack} alt="" />
              </div>
              <h2 className="w-max mx-auto">انشاء حساب</h2>
              <div className="birthdate">
                <label>
                  عيد ميلادك
                  <span>*</span>
                </label>
                <div>
                  <DatePicker
                    format="d/M/yyyy"
                    onChange={setDateValue}
                    value={dateValue}
                  />
                </div>
              </div>
              <div className="area">
                <label>
                  مدينتك
                  <span>*</span>
                </label>
                <AreaSelect
                  areaSelected={areaSelected}
                  setAreaSelected={setAreaSelected}
                />
              </div>
              <div className="gender">
                <label>
                  جنسك
                  <span>*</span>
                </label>
                <div key="inline-radio-1" id="inline-radio-1">
                  <Form.Check
                    inline
                    label="ذكر"
                    name="group1"
                    type="radio"
                    onChange={() => setGender("Male")}
                    id="inline-radio-1"
                  />
                  <Form.Check
                    inline
                    label="انثى"
                    name="group1"
                    type="radio"
                    onChange={() => setGender("Female")}
                    id="inline-radio-2"
                  />
                </div>
              </div>
              <div className="mode">
                <label>
                  بائع أم مستخدم <span>*</span>
                </label>
                <div key="inline-radio-2" id="inline-radio-2">
                  <Form.Check
                    inline
                    label="بائع"
                    name="group2"
                    type="radio"
                    onChange={() => setMode("seller")}
                    id="inline-radio-3"
                  />
                  <Form.Check
                    inline
                    label="مستخدم"
                    name="group2"
                    type="radio"
                    onChange={() => setMode("client")}
                    id="inline-radio-4"
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <div className="prev" onClick={() => setPage(0)}>
                  رجوع
                </div>
                <button
                  className="submit"
                  type="submit"
                  hidden={isSubmitting}
                  onClick={() => submitHandler(values)}
                >
                  انضم الآن
                </button>
                <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
              </div>
            </form>
          </Container>
        )}
      </Formik>
    </section>
  );
};
export default Register;
