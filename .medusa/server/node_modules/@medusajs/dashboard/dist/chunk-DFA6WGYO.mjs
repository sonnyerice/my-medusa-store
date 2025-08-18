import {
  TextCell
} from "./chunk-MSDRGCRR.mjs";
import {
  useQueryParams
} from "./chunk-C76H5USB.mjs";

// src/hooks/table/columns/use-collection-table-columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { jsx } from "react/jsx-runtime";
var columnHelper = createColumnHelper();
var useCollectionTableColumns = () => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        cell: ({ getValue }) => /* @__PURE__ */ jsx(TextCell, { text: getValue() })
      }),
      columnHelper.accessor("handle", {
        header: t("fields.handle"),
        cell: ({ getValue }) => /* @__PURE__ */ jsx(TextCell, { text: `/${getValue()}` })
      }),
      columnHelper.accessor("products", {
        header: t("fields.products"),
        cell: ({ getValue }) => {
          const count = getValue()?.length || void 0;
          return /* @__PURE__ */ jsx(TextCell, { text: count });
        }
      })
    ],
    [t]
  );
};

// src/hooks/table/query/use-collection-table-query.tsx
var useCollectionTableQuery = ({
  prefix,
  pageSize = 20
}) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order", "created_at", "updated_at"],
    prefix
  );
  const { offset, created_at, updated_at, q, order } = queryObject;
  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : void 0,
    updated_at: updated_at ? JSON.parse(updated_at) : void 0,
    q
  };
  return {
    searchParams,
    raw: queryObject
  };
};

// src/hooks/table/query/use-product-tag-table-query.tsx
var useProductTagTableQuery = ({
  prefix,
  pageSize = 20
}) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order", "created_at", "updated_at"],
    prefix
  );
  const { offset, q, order, created_at, updated_at } = queryObject;
  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : void 0,
    updated_at: updated_at ? JSON.parse(updated_at) : void 0,
    q
  };
  return {
    searchParams,
    raw: queryObject
  };
};

// src/hooks/table/query/use-return-reason-table-query.tsx
var useReturnReasonTableQuery = ({
  prefix,
  pageSize = 20
}) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order", "created_at", "updated_at"],
    prefix
  );
  const { offset, q, order, created_at, updated_at } = queryObject;
  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order,
    created_at: created_at ? JSON.parse(created_at) : void 0,
    updated_at: updated_at ? JSON.parse(updated_at) : void 0,
    q
  };
  return {
    searchParams,
    raw: queryObject
  };
};

export {
  useCollectionTableColumns,
  useCollectionTableQuery,
  useProductTagTableQuery,
  useReturnReasonTableQuery
};
