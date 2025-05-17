import { Container } from "react-bootstrap";
import * as Yup from "yup";
import "./provider-page.css";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { ErrorMessage, Formik } from "formik";
import LoaderButton from "../../Components/LoaderButton";
import { postToAPI } from "../../api/FetchFromAPI";
import { toast } from "react-hot-toast";
import { getProviderBalance } from "../../utils/constants";
const addBalanceSchema = Yup.object().shape({
  username: Yup.string()
    .required("لم تدخل اسم المستخدم بعد")
    .min(3, "اسم المستخدم قصير جدا")
    .max(50, "اسم المستخدم كبير جدا"),
  balance: Yup.number()
    .required("لم تدخل الرصيد بعد")
    .min(2000, "الرصيد يجب أن يكون أكثر من 2000")
    .max(20000, "الرصيد يجب ألا يتجاوز 20000"),
});
const ProviderPage = () => {
  const [providerUser, setProviderUser] = useState(null);
  const [providerToken, setProviderToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    username: "",
    balance: "",
  };
  useEffect(() => {
    const storedproviderUser = Cookies.get("providerUser");
    const storedproviderToken = Cookies.get("providerToken");
    storedproviderUser && setProviderUser(JSON.parse(storedproviderUser));
    storedproviderToken && setProviderToken(storedproviderToken);
    !providerUser?.is_admin &&
      getProviderBalance(storedproviderToken, setProviderUser);
  }, []);
  const submitHandler = async (values, resetForm) => {
    setIsSubmitting(1);
    try {
      const payload = {
        username: values.username,
        charged_balance: values.balance,
      };
      let bearer = `token ${providerToken}`;

      await postToAPI("api/charge_balance", payload, {
        headers: {
          Authorization: bearer,
        },
      });
      !providerUser?.is_admin &&
        (await getProviderBalance(providerToken, setProviderUser));
      resetForm();
      toast.success("تم تحويل الرصيد بنجاح", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setIsSubmitting(0);
    } catch (err) {
      setIsSubmitting(0);
      if (err.response?.data?.detail === "You don't have enough balance") {
        toast.error("لا تملك رصيد كافي لاتمام الطلب", {
          duration: 3000,
          position: "top-center",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        });
      }

      console.log(err);
    }
  };
  return (
    <div className="provider">
      <Container>
        <div className="balance d-flex justify-content-center flex-column gap-1">
          <div className="d-flex align-items-center gap-3 mx-auto">
            <h1 className="w-max">رصيدك المتاح</h1>
            <ion-icon name="cash-outline"></ion-icon>
          </div>
          {providerUser?.is_admin ? (
            <span className="infinity w-max mx-auto">∞</span>
          ) : (
            <span className="balance-number w-max mx-auto">
              {providerUser?.balance}
            </span>
          )}
        </div>
        <Formik
          initialValues={initialValues}
          validationSchema={addBalanceSchema}
        >
          {({
            values,
            resetForm,
            isValid,
            handleChange,
            handleBlur,
            errors,
            touched,
          }) => (
            <form
              data-aos="fade-up"
              onSubmit={(e) => e.preventDefault()}
              className="provider-form"
            >
              <div className="username-field">
                <label>
                  اسم المستخدم
                  <span>*</span>
                </label>
                <input
                  className={`${
                    touched.username && errors.username ? "error " : null
                  }`}
                  id="username"
                  name="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.username}
                />
                <p>
                  <ErrorMessage name="username" />
                </p>
              </div>
              <div className="balance-field">
                <label>
                  قيمة الرصيد
                  <span>*</span>
                </label>
                <input
                  className={`${
                    touched.balance && errors.balance ? "error " : null
                  }`}
                  id="balance"
                  name="balance"
                  type="number"
                  placeholder="أدخل قيمة الرصيد"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.balance}
                />
                <p>
                  <ErrorMessage name="balance" />
                </p>
              </div>

              <button
                className={!isValid ? "submit disable" : "submit"}
                disabled={!isValid}
                type="submit"
                hidden={isSubmitting}
                onClick={() => submitHandler(values, resetForm)}
              >
                تعبئة رصيد
              </button>
              <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
            </form>
          )}
        </Formik>
      </Container>
    </div>
  );
};

export default ProviderPage;
