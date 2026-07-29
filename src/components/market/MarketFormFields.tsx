import { useId } from "react";
import { Input } from "@/components/ui/input";

export interface MarketFormValues {
  title: string;
  description: string;
  pointLabel: string;
  adminCode: string;
  startsAt: string;
  endsAt: string;
}

const dateInputClass =
  "h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-base text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12"
      />
    </div>
  );
}

function LabeledDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={dateInputClass}
      />
    </div>
  );
}

export function MarketFormFields({
  values,
  onChange,
}: {
  values: MarketFormValues;
  onChange: (patch: Partial<MarketFormValues>) => void;
}) {
  return (
    <div className="space-y-4">
      <LabeledInput
        label="마켓 이름"
        value={values.title}
        onChange={(title) => onChange({ title })}
      />
      <LabeledInput
        label="설명"
        value={values.description}
        onChange={(description) => onChange({ description })}
      />
      <LabeledInput
        label="포인트 이름"
        value={values.pointLabel}
        onChange={(pointLabel) => onChange({ pointLabel })}
      />
      <LabeledInput
        label="관리자 인증코드"
        value={values.adminCode}
        onChange={(adminCode) => onChange({ adminCode })}
      />
      <LabeledDateInput
        label="시작 일시"
        value={values.startsAt}
        onChange={(startsAt) => onChange({ startsAt })}
      />
      <LabeledDateInput
        label="종료 일시"
        value={values.endsAt}
        onChange={(endsAt) => onChange({ endsAt })}
      />
    </div>
  );
}
