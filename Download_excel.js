import React, { useState, useEffect, useRef } from "react";
import {
  Toolbar,
  Grid,
  makeStyles,
  CardContent,
  TextField,
  Avatar,
} from "@material-ui/core";
import { GlobalHeader } from "components/navigation/components/GlobalHeader";
import KisshtTable from "components/table/KisshtTable";
import { ROUTES_VAR, PERMISSIONS, ROUTE_NAME } from "shared/constants";
import Colors from "shared/color";
import { BootstrapBadge } from "components/ui/BootstrapBadge";
import {
  IsEmpty,
  getQueryParam,
  readableFormatDate,
  toastError,
  toastSuccess,
} from "shared/utils";

import Header from "components/navigation/Header";
import KisshtLink from "components/ui/KisshtLink";
import { KisshtDialog } from "components/custom/KisshtDialog";
import BulkUpload from "pages/Loans/dialog/bulkupload";
import ResponsiveMenu from "components/ui/ResponsiveMenu";
import KisshtButton from "components/ui/KisshtButton";
import { useLocation } from "react-router-dom";
import {
  getDhVerificationBlockSubUsertList,
  getHiatusCallVerification,
} from "shared/api/dhVerification";
import { Search } from "@material-ui/icons";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getDhVerificationtList } from "shared/api/dhVerification";
import XLSX from "xlsx";
import RefreshIcon from "./../../assets/images/new-ui-changes-icons/refresh-ccw.svg";
import ResposiveNewDesignMenu from "components/ui/new-design/ResposiveNewDesignMenu";
import ExcelIcon from "./../../assets/images/new-ui-changes-icons/excel.svg";
import CustomSelectNewDesign from "components/ui/new-design/CustomSelectNewDesign";
import CustomInputNewDesign from "components/ui/new-design/CustomInputNewDesign";
import ButtonV2 from "components/ui/new-design/ButtonV2";
import ResponsiveButtonNewDesign from "components/ui/new-design/ResponsiveButtonNewDesign";
import BulkUploadIcon from "./../../assets/images/new-ui-changes-icons/upload (1).svg";

const useStyles = makeStyles((theme) => ({
  table: {
    borderRadius: "5px",
    "& .MuiTableCell-root": {
      borderBottom: "none",
    },
  },
  card: {
    "& .MuiCardHeader-root": {
      padding: "12px",
      paddingBottom: 0,
    },
  },
  "& .MuiPagination-root": {
    textAlign: "center",
  },
  tex_title: {
    marginBottom: "1.3rem",
    color: "#14171A",
    fontWeight: "bold",
  },
  excel: {
    textDecoration: "underline",
    textUnderlinePosition: "under",
    textDecorationSkipInk: "auto",
    colo: "#1D44E9",
    fontSize: "13px",
  },
}));
const items = [
  {
    reason: "DH_CALLER_ALLOCATION",
    name: "Bulk Upload Allocation Cases",
    module: "ADMIN_SERVICE",
  },
  {
    reason: "DH_CUSTOMER_RESPONSE",
    name: "DH Customer Data Dump",
    module: "ADMIN_SERVICE",
  },
  {
    reason: "DH_ALLOCATION_STATUS",
    name: "Bulk Upload to Change Subuser Status",
    module: "ADMIN_SERVICE",
  },
];

export const HiatusCallVerification = (props) => {
  const { params, updateQueryParams, delteQueryParams } = props;
  const classes = useStyles();
  const [spinning, setSpinning] = useState(false);
  const [dhlist, SetDhlist] = useState([]);
  const { page_no } = props.params;
  const [offset, setoffset] = useState(Number(page_no) || 1);
  const [search, setSearch] = useState(params["search"] || "");
  const [selected, setSelected] = useState(params["selected"] || "");
  const [status, setStatus] = useState(params["status"] || "");
  const [reload, setreload] = useState(false);
  const total_count = useRef(0);
  const [model, setmodel] = useState(false);
  const [isFileDownloading, setisFileDownloading] = useState(false);
  const [resultsPerPage, setResultsPerPage] = useState("20");
  const selectedMenu = useRef(null);
  const isMounted = useRef(null);
  const location = useLocation();

  const [uploadModel, setuploadModel] = useState(false);

  const schema = Yup.object().shape({
    status: Yup.string(),
    selected: Yup.string(),
    search: Yup.string("").when("selected", (selected, schema) => {
      if (selected) {
        return schema.required("Please enter search");
      } else {
        return schema;
      }
    }),
    from_date: Yup.string(),
    to_date: Yup.string(),
  });
  const fetchDherificationListing = async () => {
    let param = getParam();

    if (param) {
      setSpinning(true);
      getHiatusCallVerification(param)
        .then((res) => {
          setSpinning(false);
          SetDhlist([]);
          if (res.hasOwnProperty("success") && res.success) {
            const { data } = res;

            if (
              data &&
              data.hasOwnProperty("dh_verification") &&
              data.dh_verification.length > 0
            ) {
              total_count.current = data.total_count;
              SetDhlist(data.dh_verification);
            } else {
              SetDhlist([]);
            }
          }
        })
        .catch((error) => {
          total_count.current = 0;
          SetDhlist([]);
          setSpinning(false);
        });
    }
  };

  const getParam = (_) => {
    const { selected, search, status, from_date, to_date } = formikForm.values;

    let param = getQueryParam({
      from_date,
      to_date,
      selected,
      search,
      status,
      offset: offset + "",
      limit: resultsPerPage,
    });
    return param ? param : "";
  };

  const handleSelect = async (e) => {
    e.persist();
    if (e) {
      let item = e.target.value;
      if (!item) {
        await setSearch("");
        await delteQueryParams();
      }
      setSelected(item);
    }
  };

  const handleStatus = async (e) => {
    e.persist();
    if (e) {
      let item = e.target.value;
      if (!item) {
        await setStatus("");
      } else {
        await setStatus(item);
      }
      isMounted.current = true;
      await setreload(!reload);
    }
  };

  useEffect(() => {
    // if (isMounted.current) {
    fetchDherificationListing();
    // }
  }, [reload, resultsPerPage]);

  const handleSearch = async (values) => {
    const { selected, status, search, from_date, to_date } = formikForm.values;

    if (from_date && !to_date) {
      toastError("To date is required");
      return;
    }

    if (!from_date && to_date) {
      toastError("From date is required");

      return;
    }

    await updateQueryParams({ selected, status, search, from_date, to_date });
    await fetchDherificationListing();
  };
  useEffect(() => {
    fetchDherificationListing();
  }, [reload, resultsPerPage]);

  const refreshHandler = async (_) => {
    await setoffset(1);
    await setSearch("");
    await SetDhlist([]);
    await setSelected("");
    await setStatus("");
    await delteQueryParams();
    await formikForm.resetForm();
  };

  const fetchList = async () => {
    try {
      let param = getParam();
      const res = await getDhVerificationtList(param);

      if (res.hasOwnProperty("response_code") && res.success) {
        const { dh_verification } = res.data;
        if (dh_verification && dh_verification.length > 0) {
          var ws = XLSX.utils.json_to_sheet(dh_verification);
          var wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Dhverificationlisting");
          XLSX.writeFile(wb, "Dhverificationlisting.xlsx");
          toastSuccess("File downloaded successfully!");
        } else {
          toastError("Records not found.");
        }
      }
    } catch (error) {
      toastError("Oops! something went wrong in exporting excel");
    } finally {
      setisFileDownloading(false);
    }
  };

  const fetchBlockUserList = async () => {
    try {
      let param = getParam();
      const res = await getDhVerificationBlockSubUsertList(param);

      if (res.hasOwnProperty("response_code") && res.success) {
        const { blacklisted_subuser } = res.data;
        if (blacklisted_subuser && blacklisted_subuser.length > 0) {
          var ws = XLSX.utils.json_to_sheet(blacklisted_subuser);
          var wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "blacklistedsubusers");
          XLSX.writeFile(wb, "blacklistedsubusers.xlsx");
          toastSuccess("File downloaded successfully!");
        } else {
          toastError("Records not found.");
        }
      }
    } catch (error) {
      toastError("Oops! something went wrong in exporting excel");
    } finally {
      setisFileDownloading(false);
    }
  };

  const handleMenuSelection = (id) => {
    if (id === "dh-Listing") {
      fetchList();
    } else if (id === "Black-List-Subuser") {
      fetchBlockUserList();
    }
  };

  const onResultsPerPageChange = (val) => {
    setResultsPerPage(val);
  };

  const columns = React.useMemo(() => [
    {
      Header: "User Reference No",
      accessor: "user_reference_number",
      sortable: true,
      Cell: (cell) => {
        return (
          <KisshtButton
            size="small"
            className="shadow-none"
            style={{ backgroundColor: "transparent", textAlign: "left" }}
            permission={PERMISSIONS.user.details}
            route={ROUTE_NAME.user}
            onClick={(e) => {
              if (window.localStorage) {
                const location_address = location.pathname + location.search;
                window.localStorage.removeItem(`dh_redirect_url_${cell.value}`);
                window.localStorage.setItem(
                  `dh_redirect_url_${cell.value}`,
                  location_address
                );
              }
            }}
          >
            <KisshtLink
              to={`${ROUTES_VAR.users}/${cell.value}`}
              permission={PERMISSIONS.user.details}
              route={ROUTE_NAME.user}
            >
              {cell.value}
            </KisshtLink>
          </KisshtButton>
        );
      },
      filterable: false,
    },
    {
      Header: "Transaction Reference no.",
      accessor: "transaction_reference_number",
      sortable: false,
      filterable: false,
      Cell: (cell) => {
        return (
          <KisshtLink
            to={`${ROUTES_VAR.transactions}/${cell.value}`}
            permission={PERMISSIONS.transaction.details}
            route={ROUTE_NAME.transaction}
            style={{ color: Colors.purple_400 }}
          >
            {cell.value}
          </KisshtLink>
        );
      },
    },
    {
      Header: "Name",
      accessor: "user_details.name",
      filterable: false,
      sortable: false,
      Cell: (cell) => {
        return <span>{cell.value}</span>;
      },
    },
    {
      Header: "Mobile",
      accessor: "user_details.mobile_no",
      filterable: false,
      sortable: false,
      Cell: (cell) => {
        return <span>{cell.value}</span>;
      },
    },

    {
      Header: "Email",
      accessor: "user_details.email",
      sortable: false,
      filterable: false,

      Cell: (cell) => {
        return <span>{cell.value}</span>;
      },
    },
    {
      Header: "Calling/UW Status",
      accessor: "status",
      sortable: false,
      filterable: false,
      Cell: (cell) => {
        return <BootstrapBadge text={cell.value} />;
      },
    },
    {
      Header: "Status Changed Reason",
      accessor: "status_changed_reason",
      sortable: false,
      filterable: false,
      Cell: (cell) => (
        <IsEmpty
          itemKey={cell.original}
          value="status_changed_reason"
        ></IsEmpty>
      ),
    },
    {
      Header: "Assigned Datetime",
      accessor: "status_changed_datetime",
      sortable: false,
      filterable: false,
      Cell: (cell) => (
        <IsEmpty
          itemKey={cell.original}
          value="status_changed_datetime"
        ></IsEmpty>
      ),
    },
    {
      Header: "Latest Document Uploaded Datetime",
      accessor: "latest_document_uploaded_datetime",
      sortable: false,
      filterable: false,
      Cell: (cell) => (
        <IsEmpty
          itemKey={cell.original}
          value="latest_document_uploaded_datetime"
        ></IsEmpty>
      ),
    },
    {
      Header: "Not Connected Attempts",
      accessor: "call_not_connected_count",
      sortable: false,
      filterable: false,
      Cell: (cell) => (
        <IsEmpty
          itemKey={cell.original}
          value="call_not_connected_count"
        ></IsEmpty>
      ),
    },

    {
      Header: "Created Date",
      accessor: "created_at",
      Cell: (cell) => {
        return readableFormatDate(cell.value);
      },
    },
  ]);
  const onPageChange = async (value) => {
    const { selected, status, search, from_date, to_date } = formikForm.values;

    await updateQueryParams({
      page_no: JSON.stringify(value),
      status,
      selected,
      search,
      from_date,
      to_date,
    });
    await setoffset(value);
    await setreload(!reload);
  };
  const formikForm = useFormik({
    initialValues: {
      from_date: params["from_date"] || "",
      to_date: params["to_date"] || "",
      selected: params["selected"] || "",
      status: params["status"] || "",
      search: params["search"] || "",
    },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: handleSearch,
  });
  const renderForm = () => {
    const { values, handleReset, handleChange, handleSubmit } = formikForm;
    return (
      <form onSubmit={handleSubmit}>
        <Grid container alignItems="center">
          <Grid item xs={12}>
            <Grid item className={classes.tex_title}>
              <p>DH Listing</p>
            </Grid>
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <CustomSelectNewDesign
                  onChange={handleChange}
                  nulloption="Select Status"
                  value={values.status}
                  name="status"
                  options={{
                    PENDING: "PENDING ASSIGNMENT",
                    PENDING_CL: "PENDING CALLER",
                    DOC_PENDING: "PENDING DOC CALLER",
                    PENDING_UW: "PENDING UNDERWRITER",
                    APPROVED: "APPROVED FOR DISBURSAL",
                    REJECTED: "REJECTED",
                  }}
                />
              </Grid>
              <Grid item>
                <CustomSelectNewDesign
                  onChange={handleChange}
                  nulloption="Search By"
                  name="selected"
                  value={values.selected}
                  options={{
                    user_reference_number: "User Reference No",
                    transaction_reference_number: "Transaction Reference No",
                    call_not_connected_count: "Call not Connected Count",
                  }}
                />
              </Grid>
              <Grid item>
                <CustomInputNewDesign
                  placeholder="Search"
                  name="search"
                  style={{ height: "15px" }}
                  onChange={handleChange}
                  value={values.search}
                />
              </Grid>
              <Grid item>
                <TextField
                  id="datetime-local"
                  name="from_date"
                  label="From Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  onChange={handleChange}
                  value={values.from_date}
                  InputProps={{
                    style: {
                      borderRadius: "8px",
                      width: "150px",
                      height: "36px",
                    },
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item>
                <TextField
                  id="datetime-local"
                  name="to_date"
                  label="To Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  onChange={handleChange}
                  value={values.to_date}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    style: {
                      borderRadius: "8px",
                      width: "150px",
                      height: "36px",
                    },
                  }}
                />
              </Grid>
              <Grid item>
                <ButtonV2
                  startIcon={<Search />}
                  disabled={spinning}
                  variant="contained"
                  className="shadow-none"
                  color="primary"
                  type="submit"
                  size="md"
                >
                  Search
                </ButtonV2>
              </Grid>
              <Grid item>
                <ButtonV2
                  startIcon={<Avatar src={RefreshIcon} />}
                  color="primary"
                  variant="outlined"
                  onClick={() => refreshHandler(handleReset)}
                  size="md"
                >
                  Reset
                </ButtonV2>
              </Grid>

            </Grid>
          </Grid>
        </Grid>
      </form>
    );
  };

  return (
    <>
      <Header open={props.open}>
        <Toolbar
          style={{
            background: "#FFFFFF",
          }}
        >
          <GlobalHeader />
        </Toolbar>
      </Header>
      <Toolbar>{renderForm()}</Toolbar>
      <Toolbar>
        <Grid
          container
          alignItems="center"
          justifyContent="flex-end"

        >
          <Grid item>
            <Grid
              container
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
            >
              <ResponsiveButtonNewDesign
                route={ROUTE_NAME["dh-verification"]}
                permission={PERMISSIONS["dh-verification"].update_dh_status}
                variant="text"
                color="primary"
                id="upload-dh-status"
                style={{
                  color: '#1D44E9',
                  textDecorationLine: "underline",
                  textUnderlinePosition: "under"
                }}
                onClick={(e) => {setuploadModel(true)}}
                startIcon={<Avatar src={BulkUploadIcon} />}
              >
                Upload
              </ResponsiveButtonNewDesign>
            </Grid>
          </Grid>
          <Grid item>
            <Grid
              container
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
            >
              <ResponsiveMenu
                buttonText={
                  <span className={classes.excel}>Export To Excel</span>
                }
                disabled={isFileDownloading}
                onSelect={(id) => handleMenuSelection(id)}
                startIcon={
                  <Avatar
                    src={ExcelIcon}
                    style={{
                      position: "relative",
                      padding: "10px",
                      left: "9px"
                    }}
                  />
                }
                menuItems={[
                  {
                    route: ROUTE_NAME["dh-verification"],
                    permission:
                      PERMISSIONS["dh-verification"].download_report_data,
                    text: "DH Listing",
                    id: "dh-Listing",
                  },
                  {
                    route: ROUTE_NAME["dh-verification"],
                    permission:
                      PERMISSIONS["dh-verification"].download_report_data,
                    text: "Black Listed Subuser",
                    id: "Black-List-Subuser",
                  },
                ]}
              />
            </Grid>
          </Grid>
          <Grid item style={{ marginLeft: "14px" }}>
            <Grid
              container
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
            >
              <ResposiveNewDesignMenu
                disabled={spinning}
                onSelect={(index) => {
                  if (index >= 0) {
                    selectedMenu.current = items[index];
                    setmodel(true);
                  }
                }}
                menuItems={[
                  {
                    route: ROUTE_NAME["dh-verification"],
                    permission: PERMISSIONS["dh-verification"].getList,
                    text: "Bulk Upload Allocation Cases",
                  },
                  {
                    route: ROUTE_NAME["dh-verification"],
                    permission: PERMISSIONS["dh-verification"].getList,
                    text: "DH Customer Data Dump",
                  },
                  {
                    route: ROUTE_NAME["dh-verification"],
                    permission: PERMISSIONS["dh-verification"].getList,
                    text: "Bulk Upload to Change Subuser Status",
                  },
                ]}
              />
            </Grid>
          </Grid>
        </Grid>
      </Toolbar>

      <div style={{ marginTop: "1rem" }}>
        <CardContent>
          <KisshtTable
            loading={spinning}
            columns={columns}
            data={dhlist}
            onPageChange={onPageChange}
            showPagination={true}
            offset={offset}
            totalCount={1000}
            onResultsPerPageChange={onResultsPerPageChange}
          />
        </CardContent>
      </div>
      {model && (
        <KisshtDialog
          maxWidth="sm"
          title={selectedMenu.current.name}
          open={model}
          handleClose={setmodel}
        >
          <BulkUpload
            module={selectedMenu.current.module}
            reason={selectedMenu.current.reason}
            handleClose={setmodel}
            {...props}
          />
        </KisshtDialog>
      )}
      {uploadModel && (
        <KisshtDialog
          maxWidth="sm"
          title="Update DH Status"
          open={uploadModel}
          handleClose={setuploadModel}
        >
          <BulkUpload
            module="ADMIN_SERVICE"
            reason="UPDATE_DH_STATUS"
            handleClose={setuploadModel}
            {...props}
          />
        </KisshtDialog>
      )}
    </>
  );
};

export default HiatusCallVerification;
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Grid,
  Button,
  Card,
  CardContent,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  makeStyles,
  Tabs,
  Tab,
  Tooltip,
  InputAdornment,
  Popover,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Toolbar
} from "@material-ui/core";

import Colors from "shared/color";
import "./style.scss";
// icons
import NotVerified from "assets/svg/user/not-verified.svg";
import VerificationPending from "assets/svg/user/verification-pending.svg";
import { Kyc } from "./DocumentsTabs/Kyc";
import { Document } from "./DocumentsTabs/Document";
import {
  callCustomerNumber,
  getUserDetails,
  resetAccountAggregator,
  getUserInvoiceList,
} from "shared/api/user";
import {
  convertKeyIntoNormal,
  hasRoutePermission,
  IsEmpty,
  readableDate,
  toastError,
  toastSuccess,
  UserAction,
} from "shared/utils";
import { Skeleton } from "@material-ui/lab";
import LoanPayments from "./DocumentsTabs/LoanPayments";
import { ROUTE_NAME, PERMISSIONS } from "shared/constants";
import { KisshtDialog } from "components/custom/KisshtDialog";
import ChangeNumber from "./dialogs/ChangeNumber";
import UserTransactions from "./components/UserTransactions";
import { TableRow } from "@material-ui/core";
import Permissionguard from "shared/components/Permissionguard";
import store from "redux/index";
import { generatePaymentLink } from "shared/api/loan";
import { openPaymentlink } from "shared/utils";
import { UserPaymentLink } from "shared/dialogs/senduserpaymentlink";
import UserComments from "./dialogs/userComments";
import { connect } from "react-redux";
import { SendFlipkartPaymentLink } from "shared/dialogs/sendFlipkartPaymentLink";
import { WhatsaapLink } from "shared/dialogs/sendWhatsappLink";
import { NachRegistrationLink } from "shared/dialogs/sendNachRegistrationLink";
import SendWelcomeLetter from "shared/dialogs/sendWelcomeLetter";
import { Call as CallIcon2 } from "@material-ui/icons";
import UPIListing from "./DocumentsTabs/1StepUPI";
import ViewDisposition from "./components/Dhcomponent/ViewDisposition";
import MarkDisposition from "./components/Dhcomponent/MarkDisposition";
import Aggregator from "./DocumentsTabs/Aggregator ";
import CreditDetails from "./DocumentsTabs/credit-and-fraud/CreditDetails";
import SendVerificationSms from "./dialogs/SendVerificationSms";
import Audit from "./DocumentsTabs/Audit/Audit";
import Questionnaire from "./dialogs/Questionnaire/Questionnaire";
import RejectQuestionnaire from "./dialogs/Questionnaire/RejectQuestionnaire";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import LoanApplication from "./DocumentsTabs/LoanApplication";
import PaymentInvoices from "pages/PaymentInvoices";
import InfoIcon from "@material-ui/icons/Info";
import ResponsiveButtonNewDesign from "components/ui/new-design/ResponsiveButtonNewDesign";
import FileQuestion from "./../../assets/images/new-ui-changes-icons/file-question.svg";
import Bookmark from "./../../assets/images/new-ui-changes-icons/bookmark.svg";
import View from "./../../assets/images/new-ui-changes-icons/view.svg";
import TimerReset from "./../../assets/images/new-ui-changes-icons/timer-reset.svg";
import Smartphone from "./../../assets/images/new-ui-changes-icons/smartphone.svg";
import moreHorizontal from "./../../assets/images/new-ui-changes-icons/more-horizontal.svg";
import CrossIcon from "./../../assets/images/new-ui-changes-icons/x.svg";
import ArrowDown from "./../../assets/images/new-ui-changes-icons/Arrow-down.svg";
import ArrowUp from "./../../assets/images/new-ui-changes-icons/Arrow-up.svg";
import CardComponentNewDesign from "components/ui/new-design/CardComponentNewDesign";
import CustomInputNewDesign from "components/ui/new-design/CustomInputNewDesign";
import CallNewIcon from "../../assets/images/new-ui-changes-icons/Call.svg";
import ConfirmedCheckCircle from "../../assets/images/new-ui-changes-icons/Confirmed-check-circle.svg";
import DataNotFound from "components/ui/new-design/DataNotFound";
import ButtonV2 from "components/ui/new-design/ButtonV2";
import Header from "components/navigation/Header";
import { GlobalHeader } from "components/navigation/components/GlobalHeader";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return value === index ? children : null;
}

const useStyles = makeStyles((theme) => ({
  card: {
    boxShadow: `0px 3px 6px ${Colors["LightPurpleShadow"]}`,
  },
  table: {
    minWidth: 650,
    padding: "17px",
  },
  tableContainer: {
    boxShadow: "none",
    background:
      "transparent linear-gradient(90deg, #D86F99 0%, #285FC1 100%) 0% 0% no-repeat padding-box",
    borderRadius: "5px",
  },
  tableCell: {
    color: "#fff",
  },
  svgImg: {
    display: "inline",
    padding: "0.5px",
    borderRadius: "6px",
    margin: "0px 2px",
    backgroundColor: "#fff",
  },
  customerCallBtn: { color: "#fff", marginLeft: -10 },
  search: {
    "&  input": {
      padding: "0.43rem",
      maxwidth: "200px",
    },
  },
  endAdornment: {
    paddingRight: 0,
  },
  calendarPop: {
    display: "flex",
    alignItems: "center",
  },

  mainTitle: {
    fontSize: "20px",
    lineHeight: "24px",
    paddingTop: "16px",
    marginLeft: "-5px",
  },

  topButtons: {
    padding: "20px 0px 15px 0px",
  },

  shareLinkText: {
    fontSize: "13px",
    lineHeight: "20px",
    color: "#1D44E9",
  },

  menuCss: {
    "& .MuiPaper-rounded": {
      borderRadius: "24px",
      padding: "10px 0px 10px 0px",
    },
  },

  personalInfoMainCard: {
    padding: "10px",
    border: "1px solid #B0B3CC",
    backgroundColor: "#F5F6FA",
    borderRadius: "8px",
  },

  personalInfoMainTitle: {
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "20px",
    color: "#484B63",
    padding: "0px 0px 10px 0px",
  },

  personalInfoSubCard: {
    padding: "1.2rem",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
  },

  personalInfoSubCardValue: {
    fontSize: "13px",
    lineHeight: "35px",
    color: "#131523",
    "& strong": {
      paddingLeft: "5px",
      textTransform: "capitalize",
    },
  },

  pr5: {
    paddingRight: "5px",
  },

  dataHolder:{
    margin: '15px 0px',
    "& .MuiTab-textColorPrimary.Mui-selected":{
      color:'#1D44E9',
    },
    "& .MuiTab-root":{
      fontSize: '14px',
      borderBottom: "1px solid #E6E9F4",
      minWidth:'70px',
      padding:'6px 0px',
      marginRight:'20px',
      color:'#131523',
      fontFamily: 'manrope-medium',
      fontWeight: '500'
    },
    "& .MuiPaper-elevation1":{
      boxShadow:"none",
    },
    "& .MuiTabScrollButton-root.Mui-disabled": {
      display: 'none'
    }
  },
}));

const validatePhone = (value) => {
  const phoneNumRex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (value.match(phoneNumRex)) {
    return true;
  }
  return false;
};

const CustomerView = (props) => {
  let userReferenceNo = props.match.params.id;
  const [userLoading, setuserLoading] = useState(true);
  const [callSpinning, setcallSpinning] = useState(false);
  const [userData, setuserData] = useState({});
  const [activeTab, setsActiveTab] = useState(0);
  const [changeNumber, setChangeNUmber] = useState(false);
  const [showUserPaymentModal, setshowUserPaymentModal] = useState(false);
  const [showSendLetterModal, setShowSendLetterModal] = useState(false);
  const [userPaymentData, setuserPaymentData] = useState(null);
  const [PaymentLinkLoading, setPaymentLinkLoading] = useState(false);
  const [showFlipkartPaymentLink, setshowFlipkartPaymentLink] = useState(false);
  const [showWhatsaapLink, setshowWhatsaapLink] = useState(false);
  const [showNachRegistrationLink, setShowNachRegistrationLink] =
    useState(false);
  const [filpkartPaymentData, setFlipkartPaymentData] = useState(null);
  const [FlipkartLinkLoading, setFlipkartLinkLoading] = useState(false);
  const [openCommentsDialog, setopenCommentsDialog] = useState(false);
  const mobileNumberRef = useRef(null);
  const [phoneError, setPhoneError] = useState(null);
  const [phone, setPhone] = useState("");
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [openMarkModal, setOpenMarkModal] = useState(false);
  const [isAddress, setIsAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openSendSms, setOpenSendSms] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [rejectModal, setRejectModal] = useState({});
  const [reactivationDate, setReactivationDate] = React.useState(new Date());
  const [showUserInfo, setshowUserInfo] = useState(null);
  const [displayCall, setDisplayCall] = useState(false);
  const [showAllPersonalInfo, setShowAllPersonalInfo] = useState(false);
  const history = useHistory();

  // Share link model
  const [anchorElShareLink, setAnchorElShareLink] = React.useState(null);
  const openShareLink = Boolean(anchorElShareLink);
  const [spinning, setSpinning] = useState(false);
  const [userInvoiceData, setUserInvoiceData] = useState([]);

  let isDm = userData?.is_dm;
  const CX_ROLE_CHECK = process.env.REACT_APP_NAME === "DEV" ? [78] : [77];

  const classes = useStyles();
  const {
    auth: { user },
  } = store.getState();
  useEffect(() => {
    if (!CX_ROLE_CHECK.includes(props.role.id)) setDisplayCall(true);
    UserAction();
    if (userReferenceNo) {
      getUserDetails(userReferenceNo)
        .then((res) => {
          setuserLoading(false);
          if (
            res.hasOwnProperty("success") &&
            res.success &&
            res.data.hasOwnProperty("user")
          ) {
            setuserData(res.data.user);
          }
        })
        .catch((err) => {
          setuserData(null);
          setuserLoading(false);
        });
    }
  }, [isAddress, showQuestionnaireModal]);

  const handleCustomerCall = () => {
    let param = {
      user_mobile:
        userData && userData["basic_details"]
          ? userData["basic_details"].mobile_number
          : null,
      user_reference_number:
        userData && userData["basic_details"]
          ? userData["basic_details"].user_reference_number
          : null,
      subuser_phone: user.mobile_number,
    };
    setcallSpinning(true);
    callCustomerNumber(param)
      .then(
        (res) => {
          setcallSpinning(false);
          if (res && res.success) {
            toastSuccess(res.message);
          }
        },
        (err) => {
          setcallSpinning(false);
          toastError(err.message);
        }
      )
      .catch(() => {
        setcallSpinning(false);
      });
  };

  const getStatus = (status) => {
    switch (status) {
      case "PENDING":
        return VerificationPending;
      case "NOT_VERIFIED":
        return NotVerified;
      case "VERIFIED":
        // return CheckVerified;
        return ConfirmedCheckCircle;
      default:
        return VerificationPending;
    }
  };
  function a11yProps(index) {
    return {
      id: `scrollable-auto-tab-${index}`,
      "aria-controls": `scrollable-auto-tabpanel-${index}`,
    };
  }

  const fetchUserPaymentLink = () => {
    const { user_reference_number } = userData.basic_details;
    const params = {
      user_reference_number,
      link_type: "user_payment",
      source: "USER",
      source_reference_number: user_reference_number,
      link_behavior: "APP_THEN_WEB",
    };
    if (!userPaymentData) {
      setPaymentLinkLoading(true);
      generatePaymentLink(params)
        .then((res) => {
          setPaymentLinkLoading(false);
          if (res.success && res.data.hasOwnProperty("short_url")) {
            setuserPaymentData(res.data);
            openPaymentlink(res.data.short_url);
          } else {
            toastError(res.message);
          }
        })
        .catch(() => {
          setPaymentLinkLoading(false);
        });
    } else {
      openPaymentlink(userPaymentData.short_url);
    }
  };

  const fetchFlipkartPaymentLink = () => {
    const { user_reference_number } = userData.basic_details;
    const params = {
      user_reference_number,
      link_type: "user_payment",
      source: "USER",
      source_reference_number: user_reference_number,
      link_behavior: "APP_THEN_WEB",
      product_type: "FLIPKART",
    };
    if (!filpkartPaymentData) {
      setFlipkartLinkLoading(true);
      generatePaymentLink(params)
        .then((res) => {
          setFlipkartLinkLoading(false);
          if (res.success && res.data.hasOwnProperty("short_url")) {
            setFlipkartPaymentData(res.data);
            openPaymentlink(res.data.short_url);
          } else {
            toastError(res.message);
          }
        })
        .catch(() => {
          setFlipkartLinkLoading(false);
        });
    } else {
      openPaymentlink(filpkartPaymentData.short_url);
    }
  };

  const handleCommentClose = useCallback(() => {
    setopenCommentsDialog(false);
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    const isPhone = validatePhone(value);
    if (!isPhone) {
      setPhoneError({
        message: "Please enter a valid mobile",
      });
    } else {
      setPhoneError(null);
    }
  };

  const handleCallClick = (e) => {
    setPhoneError(null);
    if (!mobileNumberRef.current) return;
    const value = mobileNumberRef.current.value || "";
    const isPhone = validatePhone(value);
    if (!isPhone) {
      setPhoneError({
        message: "Please enter a valid mobile",
      });
      return;
    }

    let param = {
      user_mobile: value,
      user_reference_number:
        userData && userData["basic_details"]
          ? userData["basic_details"].user_reference_number
          : null,
      subuser_phone: user.mobile_number,
    };

    setcallSpinning(true);
    callCustomerNumber(param)
      .then(
        (res) => {
          setcallSpinning(false);
          if (res && res.success) {
            toastSuccess(res.message || "Call has been initiated.");
          }
        },
        (err) => {
          console.log(err);
          setcallSpinning(false);
          toastError(err.message);
        }
      )
      .catch(() => {
        setcallSpinning(false);
      });
  };

  useEffect(() => {
    return () => {
      if (window.localStorage) {
        const dh_key = `dh_redirect_url_${userReferenceNo}`;

        window.localStorage.removeItem(dh_key);
      }
    };
  }, []);
  useEffect(() => {
    if (activeTab == 10) {
      getUserInvoiceList(userReferenceNo)
        .then((res) => {
          setSpinning(false);
          if (
            res &&
            res.hasOwnProperty("data") &&
            res.data.hasOwnProperty("invoices")
          ) {
            setUserInvoiceData(res.data.invoices);
          }
        })
        .catch((error) => {
          setUserInvoiceData([]);
          setSpinning(false);
        });
    }
  }, [activeTab]);

  const submitResetHandler = (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      user_reference_number: userReferenceNo,
    };
    resetAccountAggregator(payload)
      .then((res) => {
        if (res && res.success) {
          setLoading(false);
          toastSuccess(convertKeyIntoNormal(res.message));
        }
      })
      .catch((err) => {
        setLoading(false);
        toastError(err.message);
      });
  };

  const verifAnotherCaseHandler = () => {
    if (window.localStorage) {
      const dh_key = `dh_redirect_url_${userData?.basic_details?.user_reference_number}`;
      const redirect_url = window.localStorage.getItem(dh_key);
      window.localStorage.removeItem(dh_key);
      if (redirect_url) {
        history.push(redirect_url);
      } else {
      }
    }
  };

  const handleMobileCLick = (event) => {
    switch (event.detail) {
      case 2: {
        setDisplayCall(true);
        break;
      }
      default: {
        break;
      }
    }
  };

  const handleDateChange = (date) => {
    setReactivationDate(date);
  };
  const dateObj = new Date(reactivationDate);

  function addSuffixToDay(day) {
    if (day >= 11 && day <= 13) {
      return day + "th";
    }
    switch (day % 10) {
      case 1:
        return day + "st";
      case 2:
        return day + "nd";
      case 3:
        return day + "rd";
      default:
        return day + "th";
    }
  }

  const day = addSuffixToDay(dateObj.getDate());
  const month = dateObj.toLocaleString(undefined, { month: "long" });
  const year = dateObj.getFullYear();

  const formattedDate = `${day} ${month} ${year}`;

  const handleInfoClick = (ev) => {
    setshowUserInfo(ev.currentTarget);
  };

  const handleInfoClose = () => {
    setshowUserInfo(null);
  };

  const open = Boolean(showUserInfo);

  const handleClickShareLink = (event) => {
    setAnchorElShareLink(event.currentTarget);
  };
  const handleCloseShareLink = () => {
    setAnchorElShareLink(null);
  };

  return (
    <div>
      <Header open={props.open}>
        <Toolbar
          style={{
            background: "#FFFFFF",
            // paddingBottom: "1.5rem"
          }}
        ><GlobalHeader />
        </Toolbar>
      </Header >
      <p className={classes.mainTitle}>User</p>
      {userLoading ? (
        <Grid container style={{ padding: "10px" }}>
          <Grid xs={false} md={2} className={classes.pr5}>
            <Skeleton animation="wave" variant="rect" />
          </Grid>
          <Grid xs={false} md={2} className={classes.pr5}>
            <Skeleton animation="wave" variant="rect" />
          </Grid>
          <Grid xs={false} md={2} className={classes.pr5}>
            <Skeleton animation="wave" variant="rect" />
          </Grid>
          <Grid xs={false} md={2} className={classes.pr5}>
            <Skeleton animation="wave" variant="rect" />
          </Grid>
          <Grid xs={false} md={2} className={classes.pr5}>
            <Skeleton animation="wave" variant="rect" />
          </Grid>
          <Grid xs={false} md={2} className={classes.pr5}>
            <Skeleton animation="wave" variant="rect" />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2} className={classes.topButtons}>
          {userData &&
            hasRoutePermission(
              ROUTE_NAME.user,
              props.role,
              PERMISSIONS.user.questionnaire_list
            ) &&
            userData["basic_details"] &&
            userData["dh_verification_details"] &&
            userData["dh_verification_details"]?.is_questionnaires_completed !==
              1 && (
              <Grid item>
                <ResponsiveButtonNewDesign
                  onClick={() => setShowQuestionnaireModal(true)}
                  route={ROUTE_NAME.user}
                  permission={PERMISSIONS.user.questionnaire_list}
                  variant="contained-bg-white"
                  color="primary"
                  id="user-view-questionnaire"
                  size="sm"
                  startIcon={<Avatar src={FileQuestion} />}
                >
                  Questionnaire
                </ResponsiveButtonNewDesign>
              </Grid>
            )}
          {userData &&
            hasRoutePermission(
              ROUTE_NAME.user,
              props.role,
              PERMISSIONS.user.dh_add_disposition
            ) &&
            userData["basic_details"] &&
            userData["dh_verification_details"] && (
              <Grid item>
                <ResponsiveButtonNewDesign
                  onClick={() => setOpenMarkModal(true)}
                  route={ROUTE_NAME.user}
                  permission={PERMISSIONS.user.dh_add_disposition}
                  variant="contained-bg-white"
                  color="primary"
                  id="user-view-mark-disposition"
                  size="sm"
                  startIcon={<Avatar src={Bookmark} />}
                >
                  Mark Disposition
                </ResponsiveButtonNewDesign>
              </Grid>
            )}
          {userData &&
            hasRoutePermission(
              ROUTE_NAME.user,
              props.role,
              PERMISSIONS.user.dh_get_disposition
            ) &&
            userData["basic_details"] &&
            userData["dh_verification_details"] && (
              <Grid item>
                <ResponsiveButtonNewDesign
                  onClick={() => setShowDispositionModal(true)}
                  route={ROUTE_NAME.user}
                  permission={PERMISSIONS.user.dh_get_disposition}
                  variant="contained-bg-white"
                  color="primary"
                  id="user-view-view-disposition"
                  size="sm"
                  startIcon={<Avatar src={View} />}
                >
                  View Disposition
                </ResponsiveButtonNewDesign>
              </Grid>
            )}
          {userData && userData["basic_details"] && (
            <>
              {hasRoutePermission(
                ROUTE_NAME.user,
                props.role,
                PERMISSIONS.user.reset_account_aggregator
              ) ? (
                <Grid item>
                  <ResponsiveButtonNewDesign
                    onClick={submitResetHandler}
                    route={ROUTE_NAME.user}
                    className="shadow-none"
                    permission={PERMISSIONS.user.reset_account_aggregator}
                    variant="contained-bg-white"
                    color="primary"
                    id="user-view-reset-account-aggregator"
                    size="sm"
                    startIcon={<Avatar src={TimerReset} />}
                  >
                    Reset Account Aggregator
                  </ResponsiveButtonNewDesign>
                </Grid>
              ) : (
                ""
              )}
              {userData &&
                hasRoutePermission(
                  ROUTE_NAME.user,
                  props.role,
                  PERMISSIONS.user.comments
                ) &&
                userData["basic_details"] && (
                  <Grid item>
                    <ResponsiveButtonNewDesign
                      variant="contained-bg-white"
                      color="primary"
                      id="user-view-comments"
                      size="sm"
                      route={ROUTE_NAME.user}
                      permission={PERMISSIONS.user.comments}
                      onClick={() => setopenCommentsDialog(true)}
                    >
                      Comments
                    </ResponsiveButtonNewDesign>
                  </Grid>
                )}
              {hasRoutePermission(
                ROUTE_NAME.user,
                props.role,
                PERMISSIONS.user.change_mobile_number
              ) ? (
                <Grid item>
                  <ResponsiveButtonNewDesign
                    size="sm"
                    onClick={() => setChangeNUmber(true)}
                    route={ROUTE_NAME.user}
                    className="shadow-none"
                    permission={PERMISSIONS.user.change_mobile_number}
                    variant="contained-bg-white"
                    color="primary"
                    id="user-view-change-mobile-number"
                    startIcon={<Avatar src={Smartphone} />}
                  >
                    Change Mobile Number
                  </ResponsiveButtonNewDesign>
                </Grid>
              ) : (
                ""
              )}
              {hasRoutePermission(
                ROUTE_NAME.user,
                props.role,
                PERMISSIONS.user.send_verification_sms
              ) ? (
                <Grid item>
                  <ResponsiveButtonNewDesign
                    size="sm"
                    onClick={() => setOpenSendSms(true)}
                    route={ROUTE_NAME.user}
                    className="shadow-none"
                    permission={PERMISSIONS.user.send_verification_sms}
                    variant="contained-bg-white"
                    color="primary"
                    id="user-view-send-verification-sms"
                  >
                    Send Verification SMS
                  </ResponsiveButtonNewDesign>
                </Grid>
              ) : (
                ""
              )}
              <Grid item>
                {hasRoutePermission(
                  ROUTE_NAME.user,
                  props.role,
                  PERMISSIONS.user.send_whatsapp_link
                ) ||
                hasRoutePermission(
                  ROUTE_NAME.payment,
                  props.role,
                  PERMISSIONS.payment.send_nach_registration_link
                ) ||
                hasRoutePermission(
                  ROUTE_NAME.payment,
                  props.role,
                  PERMISSIONS.payment.generate_link
                ) ||
                hasRoutePermission(
                  ROUTE_NAME.user,
                  props.role,
                  PERMISSIONS.user.send_flipkart_payment_link
                ) ||
                hasRoutePermission(
                  ROUTE_NAME.payment,
                  props.role,
                  PERMISSIONS.payment.generate_link
                ) ? (
                  <ButtonV2
                    aria-controls={open ? "share-link-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={handleClickShareLink}
                    variant="contained-bg-white"
                    color="primary"
                    id="user-view-share-link"
                    size="sm"
                    endIcon={<Avatar src={moreHorizontal} />}
                  >
                    Share Link
                  </ButtonV2>
                ) : null}
                <div className={classes.customCss}>
                  <Menu
                    id="share-link-menu"
                    anchorEl={anchorElShareLink}
                    open={openShareLink}
                    onClose={handleCloseShareLink}
                    MenuListProps={{
                      "aria-labelledby": "basic-button",
                    }}
                    className={classes.menuCss}
                  >
                    <IconButton
                      onClick={handleCloseShareLink}
                      style={{
                        display: "block",
                        marginLeft: "auto",
                        marginTop: "-7%",
                      }}
                    >
                      <img src={CrossIcon} />
                    </IconButton>
                    <Divider />
                    {hasRoutePermission(
                      ROUTE_NAME.user,
                      props.role,
                      PERMISSIONS.user.send_whatsapp_link
                    ) &&
                    (<MenuItem onClick={handleCloseShareLink}>
                      <ResponsiveButtonNewDesign
                        route={ROUTE_NAME.user}
                        permission={PERMISSIONS.user.send_whatsapp_link}
                        onClick={() => setshowWhatsaapLink(true)}
                        variant="text"
                        color="primary"
                        id="user-view-whatsapp-link"
                        size="sm"
                      >
                        Whatsapp Link
                      </ResponsiveButtonNewDesign>
                    </MenuItem>
                    )}
                    {hasRoutePermission(
                      ROUTE_NAME.payment,
                      props.role,
                      PERMISSIONS.payment.send_nach_registration_link
                    ) &&
                    (<MenuItem onClick={handleCloseShareLink}>
                      <ResponsiveButtonNewDesign
                        route={ROUTE_NAME.payment}
                        permission={
                          PERMISSIONS.payment.send_nach_registration_link
                        }
                        onClick={() => setShowNachRegistrationLink(true)}
                        variant="text"
                        color="primary"
                        id="user-view-nach-registration-link"
                        size="sm"
                      >
                        Nach Registration Link
                      </ResponsiveButtonNewDesign>
                    </MenuItem>
                    )}
                    {hasRoutePermission(
                      ROUTE_NAME.payment,
                      props.role,
                      PERMISSIONS.payment.generate_link
                    ) &&
                    (<MenuItem onClick={handleCloseShareLink}>
                      <ResponsiveButtonNewDesign
                        disabled={PaymentLinkLoading}
                        route={ROUTE_NAME.payment}
                        permission={PERMISSIONS.payment.generate_link}
                        onClick={fetchUserPaymentLink}
                        variant="text"
                        color="primary"
                        id="user-view-payment-link"
                        size="sm"
                      >
                        Payment Link
                      </ResponsiveButtonNewDesign>
                    </MenuItem>
                    )}
                    {hasRoutePermission(
                      ROUTE_NAME.user,
                      props.role,
                      PERMISSIONS.user.send_flipkart_payment_link
                    ) &&
                    (<MenuItem onClick={handleCloseShareLink}>
                      <ResponsiveButtonNewDesign
                        route={ROUTE_NAME.user}
                        permission={PERMISSIONS.user.send_flipkart_payment_link}
                        onClick={() => setshowFlipkartPaymentLink(true)}
                        variant="text"
                        color="primary"
                        id="user-view-send-flipkart-payment-link"
                        size="sm"
                      >
                        Send Flipkart Payment Link
                      </ResponsiveButtonNewDesign>
                    </MenuItem>
                    )}
                    {hasRoutePermission(
                      ROUTE_NAME.payment,
                      props.role,
                      PERMISSIONS.payment.generate_link
                    ) &&
                    (<MenuItem onClick={handleCloseShareLink}>
                      <ResponsiveButtonNewDesign
                        route={ROUTE_NAME.payment}
                        permission={PERMISSIONS.payment.generate_link}
                        onClick={fetchFlipkartPaymentLink}
                        disabled={FlipkartLinkLoading}
                        variant="text"
                        color="primary"
                        id="user-view-flipkart-payment-link"
                        size="sm"
                      >
                        Flipkart Payment Link
                      </ResponsiveButtonNewDesign>
                    </MenuItem>
                    )}
                  </Menu>
                </div>
              </Grid>
              {hasRoutePermission(
                ROUTE_NAME.collections,
                props.role,
                PERMISSIONS.collections["kaleyra-call"]
              ) &&
                displayCall && (
                  // <></>
                  <Grid item style={{ width: "25.5%" }}>
                    <CustomInputNewDesign
                      inputRef={mobileNumberRef}
                      InputLabelProps={{ shrink: true }}
                      id="call"
                      placeholder="Customer Mobile Number"
                      name="call"
                      error={Boolean(phoneError)}
                      helperText={phoneError?.message || null}
                      onChange={handlePhoneChange}
                      value={phone}
                      style={{
                        minWidth: "150%",
                        height: "10px",
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment
                            position="end"
                            style={{ left: "120%" }}
                          >
                            <Button
                              edge="end"
                              color="primary"
                              variant="contained"
                              className="float-right shadow-none"
                              id="call-icon-button"
                              style={{
                                padding: "0.1rem",
                              }}
                              onClick={handleCallClick}
                            >
                              <CallIcon2 />
                            </Button>
                          </InputAdornment>
                        ),
                        classes: {
                          adornedEnd: classes.endAdornment,
                        },
                      }}
                    />
                  </Grid>
                )}
            </>
          )}
        </Grid>
      )}
      <div className={classes.personalInfoMainCard}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
          <p className={classes.personalInfoMainTitle}>Personal Information</p>
          {userLoading ? null : (
            <img
              alt=""
              src={showAllPersonalInfo ? ArrowUp : ArrowDown}
              onClick={() => {
                setShowAllPersonalInfo(!showAllPersonalInfo);
              }}
              style={{
                cursor: "pointer",
              }}
            />
          )}
        </div>
        {userLoading ? (
          <Skeleton animation="wave" variant="rect" width="100%" height={120} />
        ) : !userData && !userLoading ? (
          <DataNotFound data="No data Found" />
        ) : (
          <div>
            {!showAllPersonalInfo ? (
              <CardComponentNewDesign>
                <Grid container>
                  <Grid md={3}>
                    <p className={classes.personalInfoSubCardValue}>
                      Name
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"full_name"}
                        />
                      </strong>
                      {userData?.basic_details?.full_name && (
                        <img
                          alt=""
                          src={getStatus(
                            userData?.basic_details?.name_verification_status
                          )}
                          className={`${classes.svgImg}`}
                        />
                      )}
                    </p>
                  </Grid>
                  {userData?.basic_details?.masked_mobile_number ? (
                    <Grid md={3}>
                      <p
                        className={classes.personalInfoSubCardValue}
                        style={{ display: "flex" }}
                      >
                        Mobile
                        <strong>
                          {hasRoutePermission(
                            ROUTE_NAME.collections,
                            props.role,
                            PERMISSIONS.collections["kaleyra-call"]
                          ) ? (
                            <Tooltip title="Call Customer">
                              <ButtonV2
                                disabled={callSpinning}
                                variant="text"
                                color="black"
                                endIcon={<Avatar src={CallNewIcon} />}
                                onClick={handleCustomerCall}
                              >
                                {userData?.basic_details?.masked_mobile_number}
                              </ButtonV2>
                            </Tooltip>
                          ) : (
                            <span>
                              {userData?.basic_details?.masked_mobile_number}
                            </span>
                          )}
                        </strong>
                        {userData?.basic_details?.mobile_number && (
                          <img
                            alt=""
                            src={getStatus(
                              userData?.basic_details
                                ?.mobile_verification_status
                            )}
                            className={`${classes.svgImg}`}
                          />
                        )}
                      </p>
                    </Grid>
                  ) : null}
                  <Grid md={3}>
                    <p className={classes.personalInfoSubCardValue}>
                      User Ref. No.
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"user_reference_number"}
                        />
                      </strong>
                    </p>
                  </Grid>
                  <Grid md={3}>
                    <p className={classes.personalInfoSubCardValue}>
                      Re-Activation Date
                      <strong> {formattedDate}</strong>
                    </p>
                  </Grid>
                </Grid>
              </CardComponentNewDesign>
            ) : (
              <Grid container>
                <Grid md={3} className={classes.pr5}>
                  <CardComponentNewDesign>
                    <p className={classes.personalInfoSubCardValue}>
                      Name
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"full_name"}
                        />
                      </strong>
                      {userData?.basic_details?.full_name && (
                        <img
                          alt=""
                          src={getStatus(
                            userData?.basic_details?.name_verification_status
                          )}
                          className={`${classes.svgImg}`}
                        />
                      )}
                    </p>
                    <p className={classes.personalInfoSubCardValue}>
                      Date Of Birth
                      <strong>
                        {" "}
                        {readableDate(userData?.basic_details?.dob)}
                      </strong>
                      {userData?.basic_details?.dob_verification_status && (
                        <img
                          alt=""
                          src={getStatus(
                            userData?.basic_details?.dob_verification_status
                          )}
                          className={`${classes.svgImg}`}
                        />
                      )}
                    </p>
                    <p className={classes.personalInfoSubCardValue}>
                      PAN
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"pan"}
                        />
                      </strong>
                      <img
                        alt=""
                        src={getStatus(
                          userData?.basic_details?.pan_verification_status
                        )}
                        className={`${classes.svgImg}`}
                      />
                    </p>
                    {userData?.basic_details?.nsdl_pan_user_name &&
                    userData?.basic_details?.nsdl_pan_user_name != null ? (
                      <p className={classes.personalInfoSubCardValue}>
                        Nsdl Pan Name
                        <strong>
                          {" "}
                          <IsEmpty
                            itemKey={userData?.basic_details}
                            value={"nsdl_pan_user_name"}
                          />
                        </strong>
                      </p>
                    ) : (
                      ""
                    )}
                    {userData?.basic_details?.kyc_re_verification_band ||
                    userData?.kyc_re_verification_details ? (
                      <p className={classes.personalInfoSubCardValue}>
                        KYC Risk Tagging
                        <strong>
                          {" "}
                          <IsEmpty
                            itemKey={userData?.basic_details}
                            value={"kyc_re_verification_band"}
                          />
                          {userData?.kyc_re_verification_details && (
                            <InfoIcon
                              onClick={handleInfoClick}
                              fontSize={"small"}
                              style={{ marginLeft: "5px" }}
                            />
                          )}
                        </strong>
                      </p>
                    ) : null}
                  </CardComponentNewDesign>
                </Grid>
                <Grid md={3} className={classes.pr5}>
                  <CardComponentNewDesign>
                    {userData?.basic_details?.masked_mobile_number ? (
                      <p
                        className={classes.personalInfoSubCardValue}
                        style={{ display: "flex" }}
                      >
                        Mobile
                        <strong>
                          {hasRoutePermission(
                            ROUTE_NAME.collections,
                            props.role,
                            PERMISSIONS.collections["kaleyra-call"]
                          ) ? (
                            <Tooltip title="Call Customer">
                              <ButtonV2
                                disabled={callSpinning}
                                variant="text"
                                color="black"
                                endIcon={<Avatar src={CallNewIcon} />}
                                onClick={handleCustomerCall}
                              >
                                {userData?.basic_details?.masked_mobile_number}
                              </ButtonV2>
                            </Tooltip>
                          ) : (
                            <span>
                              {userData?.basic_details?.masked_mobile_number}
                            </span>
                          )}
                        </strong>
                        {userData?.basic_details?.mobile_number && (
                          <img
                            alt=""
                            src={getStatus(
                              userData?.basic_details
                                ?.mobile_verification_status
                            )}
                            className={`${classes.svgImg}`}
                          />
                        )}
                      </p>
                    ) : null}
                    <p className={classes.personalInfoSubCardValue}>
                      UID
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"uid"}
                        />
                      </strong>
                    </p>
                    <p className={classes.personalInfoSubCardValue}>
                      Email
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"email"}
                        />
                      </strong>
                    </p>
                    <p className={classes.personalInfoSubCardValue}>
                      Gender
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"gender"}
                        />
                      </strong>
                      <img
                        alt=""
                        src={getStatus(
                          userData?.basic_details?.gender_verification_status
                        )}
                        className={`${classes.svgImg}`}
                      />
                    </p>
                    {!userData?.is_dm &&
                      userData?.basic_details?.source_app && (
                        <p className={classes.personalInfoSubCardValue}>
                          Source App
                          <strong>
                            {" "}
                            {userData?.basic_details?.source_app}
                          </strong>
                        </p>
                      )}
                  </CardComponentNewDesign>
                </Grid>
                <Grid md={3} className={classes.pr5}>
                  <CardComponentNewDesign>
                    <p className={classes.personalInfoSubCardValue}>
                      User Ref. No.
                      <strong>
                        {" "}
                        <IsEmpty
                          itemKey={userData?.basic_details}
                          value={"user_reference_number"}
                        />
                      </strong>
                    </p>
                    {!userData?.is_dm && (
                      <p className={classes.personalInfoSubCardValue}>
                        Created At
                        <strong>
                          {" "}
                          {readableDate(userData?.basic_details?.created_at)}
                        </strong>
                      </p>
                    )}
                    {userData?.basic_details?.first_ckyc_date && (
                      <p className={classes.personalInfoSubCardValue}>
                        First Ckyc Date
                        <strong>
                          {readableDate(
                            userData?.basic_details?.first_ckyc_date
                          )}
                        </strong>
                      </p>
                    )}
                    {userData?.dh_verification_details?.expected_aqb &&
                    !userData?.is_dm ? (
                      <p className={classes.personalInfoSubCardValue}>
                        Expected AQB
                        <strong>
                          {" "}
                          {userData?.dh_verification_details?.expected_aqb ||
                            "-"}
                        </strong>
                      </p>
                    ) : (
                      ""
                    )}
                    {!userData?.is_dm && (
                      <p className={classes.personalInfoSubCardValue}>
                        Is User Blocked
                        {userData?.blocklist_details?.is_user_blocked ==
                        "YES" ? (
                          <strong style={{ color: "#327B3D" }}> Yes </strong>
                        ) : (
                          <strong style={{ color: "#D90429" }}> No </strong>
                        )}
                      </p>
                    )}
                  </CardComponentNewDesign>
                </Grid>
                <Grid md={3} className={classes.pr5}>
                  <CardComponentNewDesign>
                    <p className={classes.personalInfoSubCardValue}>
                      Re-Activation Date
                      <strong> {formattedDate}</strong>
                    </p>
                    {userData?.basic_details?.master_user_reference_number ? (
                      <p className={classes.personalInfoSubCardValue}>
                        UCIC
                        <strong>
                          {" "}
                          <IsEmpty
                            itemKey={userData.basic_details}
                            value={"master_user_reference_number"}
                          />
                        </strong>
                      </p>
                    ) : null}
                    {userData?.basic_details?.first_ckyc_reporting_datetime ? (
                      <p className={classes.personalInfoSubCardValue}>
                        First CKYC Reporting Date
                        <strong>
                          {readableDate(
                            userData.basic_details.first_ckyc_reporting_datetime
                          )}
                        </strong>
                      </p>
                    ) : (
                      ""
                    )}
                  </CardComponentNewDesign>
                </Grid>
              </Grid>
            )}
          </div>
        )}
      </div>
      <div className="flex-spacing">
        {userData && userData.basic_details ? (
          <> 
            <div className="document-tabs">
              <div className={classes.dataHolder}>
                <Tabs
                  value={activeTab}
                  TabIndicatorProps={{ 
                    style: { 
                      backgroundColor: '#1D44E9', 
                      borderRadius: '8px', 
                      margin: '0px -5px',
                    } 
                  }}
                  textColor="primary"
                  className="shadow-none"
                  onChange={(e, newValue) => {
                    setsActiveTab(newValue);
                  }}
                  aria-label="disabled tabs example"
                  variant="scrollable"
                >
                  <Tab size="small" label="KYC" value={0} {...a11yProps(0)} />
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.audit_trail_events
                  ) && (
                    <Tab label="KYC Audit Trail" value={8} {...a11yProps(8)} />
                  )}

                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.userdocuments
                  ) && <Tab label="Documents" value={1} {...a11yProps(1)} />}
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.transactions
                  ) && <Tab label="Transactions" value={2} {...a11yProps(2)} />}

                  {/* <Tab label="Lines" {...a11yProps(2)} /> */}
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.loan_payment_listing
                  ) && <Tab label="Loan Details" value={3} {...a11yProps(3)} />}
                  {hasRoutePermission(
                    ROUTE_NAME.instruments,
                    props.role,
                    PERMISSIONS.instruments.upi_view
                  ) && (
                    <Tab
                      label="UPI - ICICI Plugin"
                      value={4}
                      {...a11yProps(4)}
                    />
                  )}
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.multipermenantblocklist
                  ) &&
                    !userData.is_dm && (
                      <Tab
                        label="Blocklist Details"
                        value={5}
                        {...a11yProps(5)}
                      />
                    )}
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.account_aggregator
                  ) && (
                    <Tab
                      label="Account Aggregator"
                      value={6}
                      {...a11yProps(6)}
                    />
                  )}
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.line_credit_fraud
                  ) && (
                    <Tab label="Credit & Fraud" value={7} {...a11yProps(7)} />
                  )}
                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.loan_transaction
                  ) && (
                    <Tab label="Loan Application" value={9} {...a11yProps(9)} />
                  )}

                  {hasRoutePermission(
                    ROUTE_NAME.user,
                    props.role,
                    PERMISSIONS.user.invoice_list
                  ) ? (
                    <Tab
                      label="Payment Invoices"
                      value={10}
                      {...a11yProps(10)}
                    />
                  ) : null}
                </Tabs>
              </div>
            </div>

            <TabPanel value={activeTab} index={0}>
              <Kyc
                userReferenceNo={userReferenceNo}
                userData={userData}
                user={user}
                isAddress={isAddress}
                setIsAddress={setIsAddress}
                transaction_reference_number={
                  userData["dh_verification_details"]
                    ?.transaction_reference_number
                }
              />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.userdocuments}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <div className="flex-spacing">
                    <Document
                      userReferenceNo={userReferenceNo}
                      transaction_reference_number={
                        userData["dh_verification_details"]
                          ?.transaction_reference_number
                      }
                      role={props.role}
                      dh_verification_details={
                        userData?.dh_verification_details
                      }
                    />
                  </div>
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.transactions}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <UserTransactions
                    userReferenceNo={userReferenceNo}
                    isDm={isDm}
                  />
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              <Permissionguard
                route={ROUTE_NAME.loan}
                permission={PERMISSIONS.loan.list}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <LoanPayments data={userData} />
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={4}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.instruments.upi_view}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <div className="flex-spacing">
                    <UPIListing userReferenceNo={userReferenceNo} />
                  </div>
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={5}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.multipermenantblocklist}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <div>
                    {/* <Card className={classes.card}>
                      <CardContent className="table_cardcontent document-tabs"> */}
                    {userData?.blocklist_details?.is_user_blocked &&
                    userData?.blocklist_details?.blocked_user_data ? (
                      <TableContainer
                        className={classes.tableContainer}
                        component={Paper}
                      >
                        <Table
                          className={classes.table}
                          aria-label="simple table"
                        >
                          <TableBody>
                            <TableRow>
                              <TableCell
                                className={classes.tableCell}
                                component="th"
                                scope="row"
                              >
                                <p className="text-sm">
                                  {userData?.blocklist_details
                                    ?.blocked_user_data?.entity_type || "-"}
                                </p>
                                <p className="text-xs opacity-75">
                                  Entity Type
                                </p>
                              </TableCell>
                              <TableCell
                                className={classes.tableCell}
                                component="th"
                                scope="row"
                              >
                                <p className="text-sm">
                                  {userData?.blocklist_details
                                    ?.blocked_user_data?.entity_value || "-"}
                                </p>
                                <p className="text-xs opacity-75">
                                  Entity Value
                                </p>
                              </TableCell>
                              <TableCell
                                className={classes.tableCell}
                                component="th"
                                scope="row"
                              >
                                <p className="text-sm">
                                  {userData?.blocklist_details
                                    ?.blocked_user_data?.blocked_reason || "-"}
                                </p>
                                <p className="text-xs opacity-75">
                                  Blocked Reason
                                </p>
                              </TableCell>
                              <TableCell
                                className={classes.tableCell}
                                component="th"
                                scope="row"
                              >
                                <p>
                                  {readableDate(
                                    userData?.blocklist_details
                                      ?.blocked_user_data?.created_at
                                  )}
                                </p>
                                <p className="text-xs opacity-75">Created At</p>
                              </TableCell>
                              <TableCell
                                className={classes.tableCell}
                                component="th"
                                scope="row"
                              >
                                <p>
                                  {readableDate(
                                    userData?.blocklist_details
                                      ?.blocked_user_data?.updated_at
                                  )}
                                </p>
                                <p className="text-xs opacity-75">Updated At</p>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : userLoading ? (
                      <Skeleton
                        animation="wave"
                        variant="rect"
                        width="100%"
                        height={120}
                      />
                    ) : (
                      <DataNotFound data="No data Found" />
                    )}
                  </div>
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={6}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.account_aggregator}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <Aggregator userReferenceNo={userReferenceNo} />
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={7}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.line_credit_fraud}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <CreditDetails
                    loading={loading}
                    setLoading={setLoading}
                    userReferenceNo={userReferenceNo}
                  />
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={8}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.audit_trail_events}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <div className="flex-spacing">
                    <Audit userReferenceNo={userReferenceNo} />
                  </div>
                </div>
              </Permissionguard>
            </TabPanel>
            <TabPanel value={activeTab} index={9}>
              <Permissionguard
                route={ROUTE_NAME.user}
                permission={PERMISSIONS.user.loan_transaction}
              >
                <div style={{ marginTop: "1.4rem" }}>
                  <LoanApplication
                    userReferenceNo={userReferenceNo}
                    isDm={isDm}
                  />
                </div>
              </Permissionguard>
            </TabPanel>
            {hasRoutePermission(
              ROUTE_NAME.user,
              props.role,
              PERMISSIONS.user.invoice_list
            ) ? (
              <TabPanel value={activeTab} index={10}>
                <Permissionguard
                  route={ROUTE_NAME.loan}
                  permission={PERMISSIONS.loan.list}
                  role={props.role}
                >
                  <div style={{ marginTop: "1.4rem" }}>
                    <PaymentInvoices
                      dataList={userInvoiceData}
                      isSpin={spinning}
                    />
                  </div>
                </Permissionguard>
              </TabPanel>
            ) : null}
          </>
        ) : null}
      </div>
      {changeNumber && (
        <KisshtDialog
          maxWidth='xsCustom'
          title="Change Mobile Number"
          open={changeNumber}
          handleClose={() => setChangeNUmber(false)}
        >
          <ChangeNumber
            basic_details={userData && userData["basic_details"]}
            handleClose={() => setChangeNUmber(false)}
            onSuccess={async () => {
              const res = await getUserDetails(userReferenceNo);
              if (res.success) {
                setuserData(res.data.user);
              }
            }}
          />
        </KisshtDialog>
      )}
      {showUserPaymentModal && (
        <UserPaymentLink
          visible={showUserPaymentModal}
          callbackEvent={() => setshowUserPaymentModal(false)}
          userRef={userData.basic_details.user_reference_number}
        />
      )}
      {showSendLetterModal && (
        <SendWelcomeLetter
          visible={showSendLetterModal}
          callbackEvent={() => setShowSendLetterModal(false)}
          userRef={userData.basic_details.user_reference_number}
        />
      )}
      {showFlipkartPaymentLink && (
        <SendFlipkartPaymentLink
          visible={showFlipkartPaymentLink}
          callbackEvent={() => setshowFlipkartPaymentLink(false)}
          userRef={userData.basic_details.user_reference_number}
        />
      )}
      {showWhatsaapLink && (
        <WhatsaapLink
          visible={showWhatsaapLink}
          callbackEvent={() => setshowWhatsaapLink(false)}
          userRef={userData?.basic_details?.user_reference_number}
          mobile_number={userData.basic_details?.mobile_number}
          masked_mobile_number={userData.basic_details?.masked_mobile_number}
        />
      )}
      {showNachRegistrationLink && (
        <NachRegistrationLink
          visible={showNachRegistrationLink}
          callbackEvent={() => setShowNachRegistrationLink(false)}
          userRef={userData?.basic_details?.user_reference_number}
        />
      )}
      {openCommentsDialog && (
        <UserComments
          visible={openCommentsDialog}
          handleClose={handleCommentClose}
          userRef={userData.basic_details.user_reference_number}
        ></UserComments>
      )}
      {showDispositionModal && (
        <KisshtDialog
          title="View Disposition"
          handleClose={setShowDispositionModal}
          maxWidth="smCustom"
        >
          <ViewDisposition
            userRef={userData.basic_details.user_reference_number}
            empref={
              userData.dh_verification_details?.transaction_reference_number
            }
          ></ViewDisposition>
        </KisshtDialog>
      )}

      {openMarkModal && (
        <KisshtDialog
          title="Mark Disposition"
          handleClose={setOpenMarkModal}
          maxWidth="xsCustom"
        >
          <MarkDisposition
            userData={userData}
            callbackEvent={setOpenMarkModal}
            role={props.role}
            user={user}
          ></MarkDisposition>
        </KisshtDialog>
      )}
      {openSendSms && (
        <SendVerificationSms
          visible={openSendSms}
          callbackEvent={() => setOpenSendSms(false)}
          userRef={userData?.basic_details?.user_reference_number}
          mobile_number={userData.basic_details?.mobile_number}
          masked_mobile_number={userData.basic_details?.masked_mobile_number}
          transaction_reference_number={
            userData["dh_verification_details"]?.transaction_reference_number
          }
        />
      )}
      {showQuestionnaireModal && (
        <KisshtDialog
          handleClose={setShowQuestionnaireModal}
          maxWidth="smCustom"
          title={`Questionnaire for ${userData?.basic_details?.full_name.toLowerCase()}`}
          style={{ whiteSpace: "nowrap" }}
        >
          <Questionnaire
            userData={userData}
            isAddress={isAddress}
            setIsAddress={setIsAddress}
            dh_verification_reference_number={
              userData.dh_verification_details?.dh_verification_reference_number
            }
            user_reference_number={
              userData?.basic_details?.user_reference_number
            }
            showQuestionnaireModal={showQuestionnaireModal}
            setShowQuestionnaireModal={setShowQuestionnaireModal}
            setRejectModal={setRejectModal}
          ></Questionnaire>
        </KisshtDialog>
      )}
      {rejectModal?.is_transaction_rejected && (
        <KisshtDialog
          title=""
          handleClose={() => {
            setRejectModal({});
            verifAnotherCaseHandler();
          }}
          maxWidth="sm"
        >
          <RejectQuestionnaire
            setRejectModal={setRejectModal}
            rejectModal={rejectModal}
            userData={userData}
          ></RejectQuestionnaire>
        </KisshtDialog>
      )}
      {userData && showUserInfo && (
        <Popover
          id="simple-popover"
          open={open}
          anchorEl={showUserInfo}
          onClose={handleInfoClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <div style={{ padding: 7 }}>
            <p>
              Latest KYC Date :{" "}
              {userData?.kyc_re_verification_details?.latest_kyc_date || "-"}
            </p>
            <p>
              Is Kyc Valid :{" "}
              {userData?.kyc_re_verification_details?.is_kyc_valid || "-"}
            </p>
            <p>
              KYC expiry Date :{" "}
              {userData?.kyc_re_verification_details?.kyc_expiry_date || "-"}
            </p>
          </div>
        </Popover>
      )}
    </div>
  );
};

const mapStateToProps = ({ role }) => ({
  role,
});

export default connect(mapStateToProps)(CustomerView);
// customer support file//
import React, { useState, useEffect, useRef } from "react";
import {
  Toolbar,
  Grid,
  Card,
  makeStyles,
  CardContent,
  TextField,
  Link,
  Avatar,
} from "@material-ui/core";

import CustomInput from "components/custom/CustomInput";
import KisshtTable from "components/table/KisshtTable";
import Colors from "shared/color";
import { getQueryParam, readableDate, toastError } from "shared/utils";
import Header from "components/navigation/Header";
import { Search } from "@material-ui/icons";
import RightSideDrawer from "components/navigation/RightSideDrawer";
import noDataFound from "assets/svg/research.svg";
import {
  getCustomersupportLisitng,
  getCustomersupportLoanLisitng,
} from "shared/api/customer_support";
import { PERMISSIONS, ROUTES_VAR, ROUTE_NAME } from "shared/constants";
import KisshtLink from "components/ui/KisshtLink";
import RefreshIcon from "./../../assets/images/new-ui-changes-icons/refresh-ccw.svg";
import CustomSelectNewDesign from "components/ui/new-design/CustomSelectNewDesign";
import ButtonV2 from "components/ui/new-design/ButtonV2";
import NoDataFoundTable from "components/ui/new-design/NoDataFoundTable";

const useStyles = makeStyles((theme) => ({
  table: {
    borderRadius: "5px",
    "& .MuiTableCell-root": {
      borderBottom: "none",
    },
  },
  card: {
    "& .MuiCardHeader-root": {
      padding: "12px",
      paddingBottom: 0,
    },
  },
  "& .MuiPagination-root": {
    textAlign: "center",
  },
  no_data_found: {
    left: "40%",
    top: "60%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "12%",
  },
  grey_text: {
    color: "#C9C8C8",
    fontSize: " 18px",
    fontWeight: "500",
    marginTop: "6px",
  },
}));

export const CustomerSupport = (props) => {
  const { params, updateQueryParams, delteQueryParams } = props;
  const classes = useStyles();
  const [spinning, setSpinning] = useState(false);
  const { page_no } = props.params;
  const [offset, setoffset] = useState(Number(page_no) || 1);
  const [search, setSearch] = useState(params["search"] || "");
  const [selected, setSelected] = useState(params["selected"] || "");
  const [reload, setreload] = useState(false);
  const [showLoanList, setShowLoanList] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const total_count = useRef(0);
  const selectedItem = useRef(null);
  const isMounted = useRef(null);
  const [LoanData, setLoanData] = useState([]);
  const [user, setUser] = useState("");
  const [loanReload, setLoanReload] = useState(false);
  const [showLoanPage, setShowLoanPage] = useState(true);

  const handleUCICClick = (cell) => {
    const user = cell?.original?.user_reference_number || "";
    setUser(user);
  };

  const fetchCustomerListing = async () => {
    let param = getParam();
    if (param) {
      await updateQueryParams({
        page_no: JSON.stringify(offset),
        selected,
        search,
      });
      setSpinning(true);
      setUser("");
      getCustomersupportLisitng(param)
        .then((res) => {
          setSpinning(false);
          setDataList([]);
          if (res.hasOwnProperty("success") && res.success) {
            const { data } = res;
            if (data && data.hasOwnProperty("user") && data.user.length > 0) {
              total_count.current = data.total_count;
              setDataList(data.user);
            } else {
              setDataList([]);
            }
          }
        })
        .catch((error) => {
          total_count.current = 0;
          setDataList([]);
          setSpinning(false);
        });
    }
  };

  const fetchCustomerLoanListing = async (user) => {
    let param = getLoanParam();
    if (param) {
      await updateQueryParams({
        page_no: JSON.stringify(offset),
      });
      setSpinning(true);
      getCustomersupportLoanLisitng(param, user)
        .then((res) => {
          setShowLoanList(true);
          setSpinning(false);
          setLoanData([]);
          if (res.hasOwnProperty("success") && res.success) {
            const { data } = res;
            if (data && data.hasOwnProperty("loans") && data.loans.length > 0) {
              setShowLoanPage(data.loans.length >= 20);
              total_count.current = data.total_count;
              setLoanData(data.loans);
            } else {
              setLoanData([]);
            }
          }
        })
        .catch((error) => {
          total_count.current = 0;
          setLoanData([]);
          setSpinning(false);
        });
    }
  };

  const getParam = (_) => {
    const param = getQueryParam({
      selected,
      search,
      offset: offset + "",
      dob: fromDate,
      limit: 20,
    });
    return param ? param : "";
  };

  const getLoanParam = (_) => {
    const param = getQueryParam({
      offset: offset + "",
      limit: 20,
    });
    return param ? param : "";
  };

  const handleSelect = async (e) => {
    e.persist();
    if (e) {
      let item = e.target.value;
      if (!item) {
        await setSearch("");
        await delteQueryParams();
      }
      setSelected(item);
    }
  };

  useEffect(() => {
    if (isMounted.current) {
      fetchCustomerListing();
    }
  }, [reload]);

  useEffect(() => {
    if (isMounted.current && user) {
      fetchCustomerLoanListing(user);
    }
  }, [loanReload, user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoanData([]);
    setShowLoanList(false);
    if (selected == "mobile_number" && !fromDate && !search) {
      toastError("Please enter mobile and DOB");
      return;
    }
    if (!selected && search) {
      toastError("Please select search by");
      return;
    }
    if (selected && !search) {
      toastError("Please enter search value");
      return;
    }
    if (selected && search) {
      isMounted.current = true;
      await setoffset(1);
      await setreload(!reload);
    }
  };

  const refreshHandler = async () => {
    await setoffset(1);
    await setSearch("");
    await setDataList([]);
    await setLoanData([]);
    await setFromDate("");
    await delteQueryParams();
  };

  const cumns = React.useMemo(() => [
    {
      Header: "UCIC",
      accessor: "ucic",
      filterable: false,
      sortable: false,
      Cell: (cell) => {
        return (
          <Link
            onClick={(e) => handleUCICClick(cell)}
            style={{ color: Colors.purple_400, cursor: "pointer" }}
          >
            {cell.value}
          </Link>
        );
      },
    },
  ]);

  const columns = React.useMemo(() => [
    {
      Header: "Loan Reference No",
      accessor: "loan_reference_number",
      filterable: false,
      sortable: false,
      Cell: (cell) => {
        return (
          <KisshtLink
            to={`${ROUTES_VAR.loans}/${cell.value}`}
            permission={PERMISSIONS.loan.user_loan_details}
            route={ROUTE_NAME.loan}
            style={{ color: Colors.purple_400 }}
          >
            {cell.value}
          </KisshtLink>
        );
      },
    },
    {
      Header: "Created Date",
      accessor: "created_at",
      Cell: (cell) => {
        return readableDate(cell.value);
      },
    },
  ]);

  const onPageChange = async (value) => {
    await setoffset(value);
    await setLoanReload(!loanReload);
  };

  return (
    <>
      <div>
        <Header open={props.open}>
          <Toolbar
            style={{
              backgroundColor: Colors["AppBarBGPurple"],
              minHeight: "81px",
            }}
          >
            <Grid item xs={12}>
              <Grid container spacing={1} alignItems="center">
                <Grid item>
                  <CustomSelectNewDesign
                    onChange={handleSelect}
                    nulloption="Search By"
                    value={selected}
                    options={{
                      user_reference_number: "User Reference Number",
                      mobile_number: "Mobile Number",
                    }}
                  />
                </Grid>
                <Grid item>
                  <CustomInput
                    placeholder="Search"
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (!inputValue.includes(" ")) {
                        setSearch(inputValue);
                      }
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                    value={search}
                  />
                </Grid>
                {selected === "mobile_number" && (
                  <Grid item xs={2}>
                    <TextField
                      style={{ marginLeft: "0.2rem" }}
                      id="datetime-local"
                      name="dob"
                      label="DOB"
                      type="date"
                      variant="outlined"
                      size="small"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                )}
                <Grid item>
                  <ButtonV2
                    style={{ marginLeft: "2rem" }}
                    startIcon={<Search />}
                    disabled={spinning}
                    variant="contained"
                    className="shadow-none"
                    color="primary"
                    size="md"
                    onClick={handleSearch}
                  >
                    Search
                  </ButtonV2>
                </Grid>
                <Grid item>
                  <ButtonV2
                    startIcon={<Avatar src={RefreshIcon} />}
                    variant="outlined"
                    color="primary"
                    size="md"
                    onClick={refreshHandler}
                  >
                    Reset
                  </ButtonV2>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={2}>
              <RightSideDrawer />
            </Grid>
          </Toolbar>
        </Header>
        <div>
          <CardContent>
            {showLoanList ? (
              LoanData.length > 0 ? (
                <KisshtTable
                  loading={spinning}
                  columns={columns}
                  data={LoanData}
                  onPageChange={onPageChange}
                  showPagination={showLoanPage}
                  offset={offset}
                  totalCount={1000}
                />
              ) : (
                <div severity="info" className={classes.no_data_found}>
                  <img src={noDataFound} width="60" alt="No Data Found"></img>
                  <NoDataFoundTable />
                </div>
              )
            ) : dataList.length > 0 ? (
              <KisshtTable
                loading={spinning}
                columns={cumns}
                data={dataList}
              />
            ) : (
              <div severity="info" className={classes.no_data_found}>
                <img src={noDataFound} width="60" alt="No Data Found"></img>
                <NoDataFoundTable />
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </>
  );
};

export default CustomerSupport;

