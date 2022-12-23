<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

// ...
use App\Entity\Media;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\HttpFoundation\Response;

class MediaController extends AbstractController
{
    /**
     * @Route("/media", name="create_media")
     */
    public function createMedia(ManagerRegistry $doctrine): Response
    {
        $entityManager = $doctrine->getManager();

        $media = new Media();
        $media->setName('Keyboard');
        $media->setFile(1999);

        // tell Doctrine you want to (eventually) save the media (no queries yet)
        $entityManager->persist($media);

        // actually executes the queries (i.e. the INSERT query)
        $entityManager->flush();

        return new Response('Saved new media with id '.$media->getId());
    }
    /**
     * @Route("/media/{id}", name="show_media")
     */
    public function show(ManagerRegistry $doctrine, int $id): Response
    {
        $media = $doctrine->getRepository(Media::class)->find($id);

        if (!$media) {
            throw $this->createNotFoundException(
                'No media found for id '.$id
            );
        }

        return new Response('Check out this great media: '.$media->getName());

        // or render a template
        // in the template, print things with {{ media.name }}
        // return $this->render('media/show.html.twig', ['media' => $media]);
    }
    /**
     * @Route("/media/{id}/delete", name="delete_media")
     */
    public function delete(ManagerRegistry $doctrine, int $id): Response
    {
        $entityManager = $doctrine->getManager();
        $media = $entityManager->getRepository(Media::class)->find($id);

        if (!$media) {
            throw $this->createNotFoundException(
                'No media found for id '.$id
            );
        }

        $entityManager->remove($media);
        $entityManager->flush();

        return new Response('Media deleted');
    }
}
