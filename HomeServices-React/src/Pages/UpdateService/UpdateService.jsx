import { Container, Spinner } from "react-bootstrap";
import * as Yup from "yup";
import CategorySelect from "../../Components/CategorySelect";
import { ErrorMessage, Formik } from "formik";
import MultiAreaSelect from "../../Components/MultiAreaSelect";
import { Toaster, toast } from "react-hot-toast";
import { useState, Fragment, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateUserTotalInfo } from "../../utils/constants";
import TypeSelect from "../../Components/TypeSelect";
import { useDispatch, useSelector } from "react-redux";
import "./update-service.css";
import { deleteFromAPI, putToAPI } from "../../api/FetchFromAPI";
import { setUserTotalInfo } from "../../Store/homeServiceSlice";
import swal from "sweetalert";
import LoaderButton from "../../Components/LoaderButton";
const updateServicSchema = Yup.object().shape({
  title: Yup.string()
    .required("لم تدخل عنوان الخدمة بعد")
    .matches(
      /^[\u0621-\u064A]+$/,
      "أدخل عنوان باللغة العربية ولا يحوي رموز أو أرقام"
    ),
  description: Yup.string()
    .required("لم تدخل وصف الخدمة بعد")
    .matches(
      /^[\u0621-\u064A]+$/,
      "أدخل الوصف باللغة العربية ولا يحوي رموز أو أرقام"
    )
    .min(10, "الوصف الذي أدخلته قصير جدا")
    .max(500, "الوصف الذي أدخلته كبير جدا"),
  average_price_per_hour: Yup.string().required("لم تدخل سعر الخدمة بعد"),
});
const UpdateService = () => {
  const { userToken, userTotalInfo, selectedServiceToUpdate } = useSelector(
    (state) => state.homeService
  );
  console.log(selectedServiceToUpdate);
  const dispatch = useDispatch();
  const history = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(0);
  const [areasServiceList, setAreasServiceList] = useState(
    selectedServiceToUpdate?.service_area
  );
  const [categoryService, setCategoryService] = useState(
    selectedServiceToUpdate?.category
  );
  const [formDataList, setFormDataList] = useState(
    selectedServiceToUpdate?.form
  );
  useEffect(() => {
    // add id and visible to each obj in formData to delete & edit
    setFormDataList(
      formDataList.map((item, index) => {
        return { id: index, ...item, visible: true };
      })
    );
  }, []);
  // protect path from client
  useEffect(() => {
    if (userTotalInfo.mode !== "seller") history(-1);
  }, []);
  const initialValues = {
    title: selectedServiceToUpdate.title,
    description: selectedServiceToUpdate.description,
    average_price_per_hour: selectedServiceToUpdate.average_price_per_hour,
  };
  const updateFormDataList = (field, value, id) => {
    console.log(finalForm);
    setFormDataList((prevList) => {
      return prevList.map((item) => {
        if (item.id === id) {
          if (field === "title") return { ...item, title: value };
          else return { ...item, note: value };
        }
        return item;
      });
    });
  };
  const handelDelete = (id) => {
    setFormDataList((prevList) => {
      return prevList.map((item) => {
        if (item.id === id) {
          return { ...item, visible: false };
        }
        return item;
      });
    });
  };
  const finalForm = formDataList?.filter((item) => item.visible);

  const submitHandler = async (values) => {
    setIsSubmitting(1);
    toast("يتم الآن حفظ التعديلات", {
      duration: 3000,
      position: "top-center",
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },
    });
    let defaultList = null;
    if (typeof areasServiceList[0] === "object") {
      defaultList = areasServiceList.map((item) => item.id);
    }
    values = {
      ...values,
      service_area: defaultList || areasServiceList,
    };
    console.log("vv", values);
    let bearer = `token ${userToken}`;
    try {
      await putToAPI(`services/retrieve_update_home_service/${id}`, values, {
        headers: {
          Authorization: bearer,
        },
      });
      await putToAPI(`services/update_form_home_service/${id}`, finalForm, {
        headers: {
          Authorization: bearer,
        },
      });
      setIsSubmitting(0);
      toast.success("تم حفظ التعديلات بنجاح", {
        duration: 3000,
        position: "top-center",
        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },
      });
      setTimeout(() => {
        history(`/user/${userTotalInfo.username}`);
      }, 1500);
    } catch (err) {
      setIsSubmitting(0);
      console.log(err);
    }
  };
  const handleShowAlert = () => {
    swal({
      title: "هل تريد حذف الخدمة",
      text: "سيؤدي حذف الخدمة إلى حذف كافة المعلومات المرتبطة بها. هل أنت متأكد من رغبتك في الاستمرار في عملية الحذف؟",
      icon: "warning",
      buttons: ["إلغاء", "تأكيد"],
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        deleteHandler();
      }
    });
  };
  const deleteHandler = async () => {
    setIsSubmitting(1);
    swal({
      title: "الرجاء الانتظار بينما يتم حذف الخدمة",
    });
    try {
      let bearer = `token ${userToken}`;
      deleteFromAPI(`services/delete_home_service/${id}`, {
        headers: {
          Authorization: bearer,
        },
      });
      await updateUserTotalInfo(dispatch, userTotalInfo, setUserTotalInfo);
      swal("تم حذف الخدمة بنجاح", {
        icon: "success",
      });
      setIsSubmitting(0);
      setTimeout(() => {
        history(`/user/${userTotalInfo.username}`);
      }, 1500);
    } catch (err) {}
  };
  return (
    <section className="update-service">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>تعديل الخدمة</h3>
          <button
            hidden={isSubmitting}
            onClick={() => handleShowAlert()}
            className="delete"
          >
            حذف الخدمة
            <ion-icon name="trash-outline"></ion-icon>
          </button>
          <LoaderButton isSubmitting={isSubmitting} color="delete" />
        </div>
        <Toaster />
        <Formik
          initialValues={initialValues}
          validationSchema={updateServicSchema}
        >
          {({ values, handleChange, errors, touched }) => (
            <Container data-aos="fade-up">
              <form
                className="add-service"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="title">
                  <label>
                    عنوان الخدمة
                    <span>*</span>
                  </label>
                  <input
                    className={`${
                      touched.title && errors.title ? "error " : null
                    }`}
                    name="title"
                    type="text"
                    onChange={handleChange}
                    value={values.title}
                  />
                  <p>
                    <ErrorMessage name="title" />
                  </p>
                </div>
                <div className="category">
                  <label>
                    التصنيف
                    <span>*</span>
                  </label>
                  <CategorySelect
                    read={true}
                    value={categoryService}
                    setCategoryService={setCategoryService}
                  />
                </div>
                <div className="areas">
                  <label>
                    المدن التي تستطيع توفير الخدمة فيها
                    <span>*</span>
                  </label>
                  <MultiAreaSelect
                    value={areasServiceList}
                    setAreasServiceList={setAreasServiceList}
                  />
                </div>
                <div className="desc">
                  <label>
                    وصف الخدمة
                    <span>*</span>
                  </label>
                  <textarea
                    name="description"
                    onChange={handleChange}
                    id=""
                    rows="9"
                  >
                    {values.description}
                  </textarea>
                </div>
                <div className="price">
                  <label>
                    متوسط السعر بالساعة بالليرة السورية
                    <span>*</span>
                  </label>
                  <input
                    className={`${
                      touched.average_price_per_hour &&
                      errors.average_price_per_hour
                        ? "error "
                        : null
                    }`}
                    name="average_price_per_hour"
                    type="number"
                    onChange={handleChange}
                    value={values.average_price_per_hour}
                  />
                </div>
              </form>
              <form onSubmit={(e) => e.preventDefault()} className="add-form">
                <h3>اسئلة الزبون</h3>
                {formDataList?.map((item, index) => {
                  if (index < 4)
                    return (
                      <Fragment>
                        <div className="question">
                          <label> السؤال ونوع الإجابة</label>
                          <div className="question-body d-flex gap-2 align-items-start">
                            <input type="text" readOnly value={item.title} />
                            <TypeSelect
                              type="read"
                              value={item.field_type}
                              setFormDataList={setFormDataList}
                              id={item.id}
                            />
                          </div>
                        </div>
                        {item !== finalForm[finalForm.length - 1] ? (
                          <hr />
                        ) : null}
                      </Fragment>
                    );
                  else if (index >= 4 && item.visible) {
                    return (
                      <Fragment>
                        <div className="question">
                          <div className="d-flex justify-content-between">
                            <label> السؤال ونوع الإجابة</label>
                            <ion-icon
                              name="close"
                              onClick={() => handelDelete(item.id)}
                            ></ion-icon>
                          </div>
                          <div className="question-body d-flex gap-2 align-items-start">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) =>
                                updateFormDataList(
                                  "title",
                                  e.target.value,
                                  item.id
                                )
                              }
                            />
                            <TypeSelect
                              type="write"
                              value={item.field_type}
                              setFormDataList={setFormDataList}
                              id={item.id}
                            />
                          </div>
                          <div className="mt-2">
                            <label htmlFor="">أضف ملاحظاتك</label>
                            <textarea
                              onChange={(e) =>
                                updateFormDataList(
                                  "note",
                                  e.target.value,
                                  item.id
                                )
                              }
                              value={item.note}
                              name=""
                              id=""
                              cols="30"
                              rows="3"
                            ></textarea>
                          </div>
                        </div>
                        {item !== finalForm[finalForm.length - 1] ? (
                          <hr />
                        ) : null}
                      </Fragment>
                    );
                  }
                })}
                {finalForm.length < 10 ? (
                  <div
                    className="add"
                    type="submit"
                    onClick={() => {
                      setFormDataList([
                        ...formDataList,
                        {
                          id: formDataList.length + 1,
                          title: "",
                          field_type: "",
                          note: "",
                          visible: true,
                        },
                      ]);
                    }}
                  >
                    <ion-icon name="add"></ion-icon>
                  </div>
                ) : null}
                <div className="btn-holder d-flex justify-content-end align-items-center">
                  <button
                    hidden={isSubmitting}
                    type="submit"
                    className="submit"
                    onClick={() => submitHandler(values)}
                  >
                    حفظ التعديلات
                  </button>
                  <LoaderButton isSubmitting={isSubmitting} color="my-btn" />
                </div>
              </form>
            </Container>
          )}
        </Formik>
      </Container>
    </section>
  );
};

export default UpdateService;
