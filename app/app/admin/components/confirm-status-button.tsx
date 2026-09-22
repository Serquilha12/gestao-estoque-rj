'use client';

export function ConfirmStatusButton({
  activo,
  entidade,
}: {
  activo: boolean;
  entidade: string;
}) {
  return (
    <button
      type="submit"
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
      onClick={(event) => {
        const action = activo ? 'desactivar' : 'activar';
        if (!window.confirm(`Deseja ${action} este ${entidade}?`)) {
          event.preventDefault();
        }
      }}
    >
      {activo ? 'Desactivar' : 'Activar'}
    </button>
  );
}
