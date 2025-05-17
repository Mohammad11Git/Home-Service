import { ErrorMessage, Formik } from "formik";
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import * as Yup from "yup";
import "./new-password.css";
import { postToAPI } from "../../api/FetchFromAPI";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LoaderButton from "../../Components/LoaderButton";
import Cookies from "js-cookie";

const newPasswordSchema = Yup.object().shape({
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
const NewPassword = () => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isPasswordVisible2, setPasswordVisible2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(0);
  const history = useNavigate();

  const initialValues = {
    password: "",
    password2: "",
  };
  const submitHandler = async (values) => {
    const code = Cookies.get("forgetPassCode");
    const email = Cookies.get("forgetPassEmail");
    const payload = {
      email: email,
      forget_password_code: code,
      new_password: values.password,
      new_password2: values.password2,
    };
    try {
      toast("الرجاء الانتظار", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setIsSubmitting(1);
      await postToAPI("api/forget_password_reset", payload);
      setIsSubmitting(0);
      Cookies.remove("forgetPassCode");
      Cookies.remove("forgetPassEmail");
      toast.success("تم تعيين كلمة المرور الجديدة بنجاح", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setTimeout(() => {
        history("/login");
      }, 3000);
    } catch (err) {
      console.log(err);
      setIsSubmitting(0);
    }
  };
  useEffect(() => {
    const code = Cookies.get("forgetPassCode");
    if (!code || code === "") history(-1);
  }, []);

  return (
    <section className="new-password mt-6 d-flex justify-content-center align-items-center">
      <Toaster />
      <Formik
        initialValues={initialValues}
        validationSchema={newPasswordSchema}
      >
        {({ values, isValid, handleChange, handleBlur, errors, touched }) => (
          <form
            data-aos="fade-up"
            onSubmit={(e) => e.preventDefault()}
            className="forget"
          >
            <h1 className="w-max">اعادة تعيين كلمة المرور</h1>
            <div className="password">
              <label>
                اكتب كلمة المرور الجديدة
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
                أكد كلمة المرور الجديدة
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
            <button
              className="my-btn"
              type="submit"
              hidden={isSubmitting}
              onClick={() => submitHandler(values)}
            >
              ارسال
            </button>
            <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
          </form>
        )}
      </Formik>
    </section>
  );
};

export default NewPassword;
