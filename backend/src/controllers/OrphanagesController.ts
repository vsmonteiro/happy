import { Request, Response } from "express";
import { getRepository } from "typeorm";
import Orphanage from "../models/Orphanage";
import orphanageView from "../views/orphanages.view";
import * as Yup from "yup";

export default {
  async index(req: Request, res: Response) {
    const orphanagesRepo = getRepository(Orphanage);
    const orphanages = await orphanagesRepo.find({
      relations: ["images"],
    });
    return res.json(orphanageView.renderMany(orphanages));
  },

  async show(req: Request, res: Response) {
    const orphanagesRepo = getRepository(Orphanage);
    const orphanage = await orphanagesRepo.findOneOrFail(req.params.id, {
      relations: ["images"],
    });

    return res.json(orphanageView.render(orphanage));
  },

  async create(req: Request, res: Response) {
    const orphanagesRepo = getRepository(Orphanage);
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = req.body;

    const reqImages = req.files as Express.Multer.File[];
    const images = reqImages.map((img) => {
      return { path: img.filename };
    });

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends: open_on_weekends === "true",
      images,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required(),
        })
      ),
    });

    await schema.validate(data, {
      abortEarly: false,
    });

    const orphanage = orphanagesRepo.create(data);

    await orphanagesRepo.save(orphanage);
    return res.status(201).json({
      orphanage,
    });
  },
};
