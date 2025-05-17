import { useEffect, useRef } from "react";
import "./verification-code-input.css";
import { postToAPI } from "../../api/FetchFromAPI";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Cookies from "js-cookie";
import LoaderButton from "../LoaderButton";

const VerificationCodeInput = () => {
  const { userInputValue } = useSelector((state) => state.homeService);
  const [forgetPassEmail, setForgetPassEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useNavigate();
  const { pathname } = useLocation();

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const checkFields = () => {
    for (let i = 0; i < inputRefs.length; i++) {
      if (inputRefs[i].current.value === "") return false;
    }
    return true;
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "ArrowRight") {
      // Move focus to the previous input field when ArrowLeft is pressed
      if (index > 0) {
        inputRefs[index - 1].current.focus();
      }
    } else if (e.key === "ArrowLeft") {
      // Move focus to the next input field when ArrowRight is pressed
      if (index < inputRefs.length - 1) {
        inputRefs[index + 1].current.focus();
      }
    } else if (e.key === "Backspace") {
      inputRefs[index].current.value = "";
    }
  };
  const handleCodeChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) inputRefs[index].current.value = "";
    else {
      if (value.length === 1) {
        if (index > 0) {
          // Move focus to the previous input field when a character is entered
          inputRefs[index - 1].current.focus();
        }
      }
    }
  };

  const getCode = () => {
    let code = [];
    for (let i = 0; i < inputRefs.length; i++) {
      code.unshift(inputRefs[i].current.value);
    }
    return code.join("");
  };
  let inputFields = [];
  for (let i = 0; i < 6; i++) {
    inputFields.push(
      <input
        key={i}
        type="text"
        maxLength="1"
        onChange={(e) => handleCodeChange(e, i)}
        onKeyDown={(e) => handleKeyDown(e, i)}
        ref={inputRefs[i]}
      />
    );
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkFields()) {
      const confirmData = {
        confirmation_code: getCode(),
        email: userInputValue.email,
      };
      setIsSubmitting(true);
      postToAPI("api/confirm_email", confirmData)
        .then((res) => {
          setIsSubmitting(false);
          toast.success(
            "رمز التحقق صحيح الرجاء الانتظار بينما يتم تحويلك الى صفحة تسجيل الدخول",
            {
              duration: 2000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            }
          );
          Cookies.remove("userInputValue");
          setTimeout(() => {
            history("/login");
          }, 2000);
        })
        .catch((err) => {
          console.log(err);
          if (err.response.data.detail === "Wrong code please try again") {
            toast.error("رمز التحقق غير صحيح", {
              duration: 3000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            });
          } else if (err.response.data.detail === "Email already verified") {
            toast.error("هذا البريد مفعل مسبقا", {
              duration: 3000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            });
          } else if (err.response.data.detail.includes("Try again")) {
            toast.error("حاول مجددا بعد 24 ساعة", {
              duration: 3000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            });
          }
        });
    } else {
      alert("Wrong fill!");
    }
  };
  const handleSubmitForForgetPassword = (e) => {
    e.preventDefault();
    const code = getCode();
    if (checkFields()) {
      console.log(code);
      const confirmData = {
        forget_password_code: code,
        email: forgetPassEmail,
      };
      toast("الرجاء الانتظار بينما يتم التحقق من الكود", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setIsSubmitting(true);
      postToAPI("api/check_forget_password_code", confirmData)
        .then((res) => {
          setIsSubmitting(false);
          toast.success(
            "رمز التحقق صحيح الرجاء الانتظار بينما يتم تحويلك الى صفحة تعيين كلمة المرور",
            {
              duration: 5000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            }
          );
          Cookies.set("forgetPassCode", code, { expires: 30 });
          setTimeout(() => {
            history("/forget_password/reset");
          }, 1000);
        })
        .catch((err) => {
          console.log(err);
          if (
            err.response.data?.forget_password_code[0] ===
            "Wrong code please try again 🙃"
          ) {
            toast.error("رمز التحقق غير صحيح", {
              duration: 3000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            });
          } else if (err.response.data.detail.includes("Try again")) {
            toast.error("حاول مجددا بعد 24 ساعة", {
              duration: 3000,
              position: "top-center",
              ariaProps: {
                role: "status",
                "aria-live": "polite",
              },
            });
          }
        });
    } else {
      alert("Wrong fill!");
    }
  };
  useEffect(() => {
    setForgetPassEmail(Cookies.get("forgetPassEmail"));
    inputRefs[inputRefs.length - 1].current.focus();
  }, []);
  return (
    <form
      className="verification-code-form"
      onSubmit={(e) => {
        pathname.includes("forget_password")
          ? handleSubmitForForgetPassword(e)
          : handleSubmit(e);
      }}
    >
      <div className="verification-code-input">{inputFields}</div>
      <button hidden={isSubmitting} type="submit">
        ارسال
      </button>
      <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
    </form>
  );
};

export default VerificationCodeInput;
