import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";

function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto grid max-w-2xl place-items-center px-4 py-20 text-center sm:px-6">
        <section className="w-full rounded-[2rem] border border-emerald-100 bg-white p-10 shadow-sm">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-700">
            ✓
          </div>
          <h1 className="mt-5 text-3xl font-bold">Payment completed</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your payment is being confirmed. The booking will remain pending while the host reviews it.
          </p>
          <button
            type="button"
            onClick={() => navigate("/my-trips")}
            className="mt-7 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white"
          >
            View my trips
          </button>
        </section>
      </main>
    </div>
  );
}

export default PaymentSuccess;
