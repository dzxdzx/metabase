import { MetabaseApi } from "metabase/services";
import { Parameter } from "metabase-types/api";
import {
  canListFieldValues,
  canListParameterValues,
  canSearchFieldValues,
  canSearchParameterValues,
} from "metabase-lib/parameters/utils/parameter-source";
import Field from "metabase-lib/metadata/Field";

export function dedupeValues<T>(valuesList: Array<[T, ...any]>) {
  const uniqueValueMap = new Map(valuesList.flat().map(o => [o[0], o]));
  return Array.from(uniqueValueMap.values());
}
export async function searchFieldValues(
  {
    fields,
    value,
    disablePKRemappingForSearch,
    maxResults,
  }: {
    fields: Field[];
    value: string;
    disablePKRemappingForSearch: boolean;
    maxResults: number;
  },
  cancelled?: Promise<unknown>,
) {
  let options = dedupeValues(
    await Promise.all(
      fields.map(field =>
        MetabaseApi.field_search(
          {
            value,
            fieldId: field.id,
            searchFieldId: field.searchField(disablePKRemappingForSearch)?.id,
            limit: maxResults,
          },
          { cancelled },
        ),
      ),
    ),
  );

  options = options.map(result => [].concat(result));
  return options;
}

export function isSearchable({
  parameter,
  fields,
  disableSearch,
  disablePKRemappingForSearch,
  valuesMode,
}: {
  parameter: Parameter;
  fields: Field[];
  disableSearch: boolean;
  disablePKRemappingForSearch: boolean;
  valuesMode: string | undefined;
}) {
  if (disableSearch) {
    return false;
  } else if (valuesMode === "search") {
    return true;
  } else if (parameter) {
    return canSearchParameterValues(parameter, disablePKRemappingForSearch);
  } else {
    return canSearchFieldValues(fields, disablePKRemappingForSearch);
  }
}

export function shouldList({
  parameter,
  fields,
  disableSearch,
}: {
  parameter: Parameter;
  fields: Field[];
  disableSearch: boolean;
}) {
  if (disableSearch) {
    return false;
  } else {
    return parameter
      ? canListParameterValues(parameter)
      : canListFieldValues(fields);
  }
}

export function getValuesMode({
  parameter,
  fields,
  disableSearch,
  disablePKRemappingForSearch,
}: {
  parameter: Parameter;
  fields: Field[];
  disableSearch: boolean;
  disablePKRemappingForSearch: boolean;
}) {
  if (
    isSearchable({
      parameter,
      fields,
      disableSearch,
      disablePKRemappingForSearch,
      valuesMode: undefined,
    })
  ) {
    return "search";
  }

  if (shouldList({ parameter, fields, disableSearch })) {
    return "list";
  }

  return "none";
}

export function searchField(
  field: Field,
  disablePKRemappingForSearch: boolean,
) {
  return field.searchField(disablePKRemappingForSearch);
}
