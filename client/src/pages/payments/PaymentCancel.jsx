import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";

function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto grid max-w-2xl place-items-center px-4 py-20 text-center sm:px-6">
        <section className="w-full rounded-[2rem] border border-amber-100 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-bold">Payment cancelled</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Your booking was not submitted for host review. You can return to My Trips and try payment again.
          </p>
          <button
            type="button"
            onClick={() => navigate("/my-trips")}
            className="mt-7 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white"
          >
            Return to my trips
          </button>
        </section>
      </main>
    </div>
  );
}

export default PaymentCancel;
