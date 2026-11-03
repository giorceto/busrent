import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  numeric,
  date,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

/** status: pending | approved | rejected | needs_docs
 *  zone:   city | 100 | 200 | bg */
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  eik: text("eik").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  vatValid: boolean("vat_valid").notNull().default(false),
  cityId: integer("city_id").references(() => cities.id),
  contactName: text("contact_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull(),
  description: text("description").notNull().default(""),
  license: text("license").notNull().default(""),
  zone: text("zone").notNull().default("100"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** type: mini (до 20) | midi (21–35) | bus (36–57) | double (58+) */
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    carrierId: integer("carrier_id")
      .notNull()
      .references(() => carriers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull().default(""),
    seats: integer("seats").notNull(),
    seatsLabel: text("seats_label").notNull(),
    year: integer("year"),
    euro: text("euro"),
    plate: text("plate"),
    extras: text("extras").array().notNull().default([]),
    description: text("description").notNull().default(""),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vehicles_carrier_idx").on(t.carrierId), index("vehicles_seats_idx").on(t.seats)],
);

/** kind: main | gallery | seatmap */
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  kind: text("kind").notNull().default("gallery"),
  fit: text("fit").notNull().default("cover"),
  sort: integer("sort").notNull().default(0),
});

/** status: open | closed */
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  fromCityId: integer("from_city_id").references(() => cities.id),
  fromText: text("from_text").notNull(),
  toText: text("to_text").notNull(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to"),
  tripType: text("trip_type").notNull(),
  pax: integer("pax").notNull(),
  luggage: text("luggage").notNull().default(""),
  extras: text("extras").array().notNull().default([]),
  note: text("note").notNull().default(""),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const requestRecipients = pgTable(
  "request_recipients",
  {
    requestId: integer("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    carrierId: integer("carrier_id")
      .notNull()
      .references(() => carriers.id, { onDelete: "cascade" }),
    declined: boolean("declined").notNull().default(false),
    notifiedAt: timestamp("notified_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.carrierId] })],
);

/** status: sent | accepted | lost */
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  carrierId: integer("carrier_id")
    .notNull()
    .references(() => carriers.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  validUntil: date("valid_until"),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** kind: license | registration | insurance | inspection | tachograph */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  carrierId: integer("carrier_id")
    .notNull()
    .references(() => carriers.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  fileUrl: text("file_url").notNull(),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type City = typeof cities.$inferSelect;
export type Carrier = typeof carriers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Offer = typeof offers.$inferSelect;
