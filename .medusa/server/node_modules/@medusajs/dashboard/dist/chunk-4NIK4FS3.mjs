import {
  ordersQueryKeys
} from "./chunk-KSRI5LOF.mjs";
import {
  queryClient
} from "./chunk-FXYH54JP.mjs";
import {
  queryKeysFactory
} from "./chunk-774WSTCC.mjs";
import {
  sdk
} from "./chunk-DEQUVHHE.mjs";

// src/hooks/api/plugins.tsx
import { useQuery } from "@tanstack/react-query";
var PLUGINS_QUERY_KEY = "plugins";
var pluginsQueryKeys = queryKeysFactory(PLUGINS_QUERY_KEY);
var usePlugins = (options) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.plugin.list(),
    queryKey: pluginsQueryKeys.list(),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/product-variants.tsx
import { useQuery as useQuery2 } from "@tanstack/react-query";
var PRODUCT_VARIANT_QUERY_KEY = "product_variant";
var productVariantQueryKeys = queryKeysFactory(
  PRODUCT_VARIANT_QUERY_KEY
);
var useVariants = (query, options) => {
  const { data, ...rest } = useQuery2({
    queryFn: () => sdk.admin.productVariant.list(query),
    queryKey: productVariantQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/shipping-option-types.tsx
import {
  useMutation,
  useQuery as useQuery3
} from "@tanstack/react-query";
var SHIPPING_OPTION_TYPES_QUERY_KEY = "shipping_option_types";
var shippingOptionTypesQueryKeys = queryKeysFactory(
  SHIPPING_OPTION_TYPES_QUERY_KEY
);
var useShippingOptionType = (id, query, options) => {
  const { data, ...rest } = useQuery3({
    queryFn: () => sdk.admin.shippingOptionType.retrieve(id, query),
    queryKey: shippingOptionTypesQueryKeys.detail(id),
    ...options
  });
  return { ...data, ...rest };
};
var useShippingOptionTypes = (query, options) => {
  const { data, ...rest } = useQuery3({
    queryFn: () => sdk.admin.shippingOptionType.list(query),
    queryKey: shippingOptionTypesQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};
var useCreateShippingOptionType = (options) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingOptionType.create(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useUpdateShippingOptionType = (id, options) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.shippingOptionType.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useDeleteShippingOptionType = (id, options) => {
  return useMutation({
    mutationFn: () => sdk.admin.shippingOptionType.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: shippingOptionTypesQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/tags.tsx
import {
  useMutation as useMutation2,
  useQuery as useQuery4
} from "@tanstack/react-query";
var TAGS_QUERY_KEY = "tags";
var productTagsQueryKeys = queryKeysFactory(TAGS_QUERY_KEY);
var useProductTag = (id, query, options) => {
  const { data, ...rest } = useQuery4({
    queryKey: productTagsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.productTag.retrieve(id),
    ...options
  });
  return { ...data, ...rest };
};
var useProductTags = (query, options) => {
  const { data, ...rest } = useQuery4({
    queryKey: productTagsQueryKeys.list(query),
    queryFn: async () => sdk.admin.productTag.list(query),
    ...options
  });
  return { ...data, ...rest };
};
var useCreateProductTag = (query, options) => {
  return useMutation2({
    mutationFn: async (data) => sdk.admin.productTag.create(data, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists()
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useUpdateProductTag = (id, query, options) => {
  return useMutation2({
    mutationFn: async (data) => sdk.admin.productTag.update(id, data, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(data.product_tag.id, query)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
var useDeleteProductTag = (id, options) => {
  return useMutation2({
    mutationFn: async () => sdk.admin.productTag.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: productTagsQueryKeys.detail(id)
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/fulfillment.tsx
import { useMutation as useMutation3 } from "@tanstack/react-query";
var FULFILLMENTS_QUERY_KEY = "fulfillments";
var fulfillmentsQueryKeys = queryKeysFactory(FULFILLMENTS_QUERY_KEY);

// src/hooks/api/notification.tsx
import { useQuery as useQuery5 } from "@tanstack/react-query";
var NOTIFICATION_QUERY_KEY = "notification";
var notificationQueryKeys = queryKeysFactory(NOTIFICATION_QUERY_KEY);
var useNotifications = (query, options) => {
  const { data, ...rest } = useQuery5({
    queryFn: () => sdk.admin.notification.list(query),
    queryKey: notificationQueryKeys.list(query),
    ...options
  });
  return { ...data, ...rest };
};

// src/hooks/api/payment-collections.tsx
import { useMutation as useMutation4 } from "@tanstack/react-query";
var PAYMENT_COLLECTION_QUERY_KEY = "payment-collection";
var paymentCollectionQueryKeys = queryKeysFactory(
  PAYMENT_COLLECTION_QUERY_KEY
);
var useMarkPaymentCollectionAsPaid = (orderId, paymentCollectionId, options) => {
  return useMutation4({
    mutationFn: (payload) => sdk.admin.paymentCollection.markAsPaid(paymentCollectionId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details()
      });
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId)
      });
      queryClient.invalidateQueries({
        queryKey: paymentCollectionQueryKeys.all
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

// src/hooks/api/refund-reasons.tsx
import { useQuery as useQuery6 } from "@tanstack/react-query";
var REFUND_REASON_QUERY_KEY = "refund-reason";
var refundReasonQueryKeys = queryKeysFactory(REFUND_REASON_QUERY_KEY);

export {
  notificationQueryKeys,
  useNotifications,
  useMarkPaymentCollectionAsPaid,
  usePlugins,
  productVariantQueryKeys,
  useVariants,
  shippingOptionTypesQueryKeys,
  useShippingOptionType,
  useShippingOptionTypes,
  useCreateShippingOptionType,
  useUpdateShippingOptionType,
  useDeleteShippingOptionType,
  productTagsQueryKeys,
  useProductTag,
  useProductTags,
  useCreateProductTag,
  useUpdateProductTag,
  useDeleteProductTag
};
